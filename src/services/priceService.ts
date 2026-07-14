/**
 * Price Service
 * Fetches live fuel prices from the Windecker CRM backend.
 * Falls back to cached or default prices if offline.
 *
 * To connect live data: set API_BASE_URL to your CRM backend URL
 * and ensure the /api/prices endpoint returns ProductPrice[].
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Config ──────────────────────────────────────────────────────────────────
const API_BASE_URL = 'https://windecker-crm.up.railway.app';
const CACHE_KEY = 'fuel_prices_cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // refresh every 6 hours

export interface ProductPrice {
  id: string;
  price: number;
  updatedAt: string; // ISO date string
}

interface PriceCache {
  prices: ProductPrice[];
  fetchedAt: number;
}

// ── Fetch from API ───────────────────────────────────────────────────────────
async function fetchFromAPI(): Promise<ProductPrice[]> {
  const res = await fetch(`${API_BASE_URL}/api/prices`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Price API returned ${res.status}`);
  return res.json();
}

// ── Cache helpers ────────────────────────────────────────────────────────────
async function getCached(): Promise<PriceCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveCache(prices: ProductPrice[]) {
  const cache: PriceCache = { prices, fetchedAt: Date.now() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// ── Main export ──────────────────────────────────────────────────────────────
/**
 * Returns live prices (from API or fresh cache).
 * Falls back to stale cache or null if completely offline.
 */
export async function fetchLivePrices(): Promise<{
  prices: ProductPrice[];
  source: 'live' | 'cache' | 'offline';
  lastUpdated: Date | null;
}> {
  // Check cache freshness
  const cached = await getCached();
  const cacheAge = cached ? Date.now() - cached.fetchedAt : Infinity;

  if (cached && cacheAge < CACHE_TTL_MS) {
    return { prices: cached.prices, source: 'cache', lastUpdated: new Date(cached.fetchedAt) };
  }

  // Try live fetch
  try {
    const prices = await fetchFromAPI();
    await saveCache(prices);
    return { prices, source: 'live', lastUpdated: new Date() };
  } catch {
    // Return stale cache if available
    if (cached) {
      return { prices: cached.prices, source: 'cache', lastUpdated: new Date(cached.fetchedAt) };
    }
    return { prices: [], source: 'offline', lastUpdated: null };
  }
}

/** Invalidate cache to force a fresh fetch on next load */
export async function invalidatePriceCache() {
  await AsyncStorage.removeItem(CACHE_KEY);
}

/** Format the last-updated timestamp for display */
export function formatLastUpdated(date: Date | null): string {
  if (!date) return 'Price data unavailable';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Prices updated just now';
  if (diffMins < 60) return `Prices updated ${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `Prices updated ${diffHrs}h ago`;
  return `Prices updated ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
