/**
 * Price Service
 * Fetches the logged-in customer's own delivered prices from the CRM
 * (rack + freight band x FSC + margin, cheapest terminal — computed
 * server-side; the app never sees cost internals). Falls back to cached
 * prices if offline.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://windecker-crm.up.railway.app';
const CACHE_KEY = 'fuel_prices_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // refresh every 15 min — same-day price changes must reach customers fast

export interface ProductPrice {
  id: string;
  name: string;
  unit: string;
  price: number;
  updatedAt: string; // ISO date string
}

interface PriceCache {
  prices: ProductPrice[];
  fetchedAt: number;
}

// ── Fetch from API ───────────────────────────────────────────────────────────
async function fetchFromAPI(token: string): Promise<ProductPrice[]> {
  const res = await fetch(`${API_BASE_URL}/api/customer/prices`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Price API returned ${res.status}`);
  const data = await res.json();
  return (data.prices as { id: string; name: string; unit: string; price: number }[]).map((p) => ({
    ...p,
    updatedAt: data.updatedAt,
  }));
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
 * Returns the logged-in customer's live prices (from API or fresh cache).
 * Falls back to stale cache or empty if completely offline.
 */
export async function fetchLivePrices(token: string): Promise<{
  prices: ProductPrice[];
  source: 'live' | 'cache' | 'offline';
  lastUpdated: Date | null;
}> {
  const cached = await getCached();
  const cacheAge = cached ? Date.now() - cached.fetchedAt : Infinity;

  if (cached && cacheAge < CACHE_TTL_MS) {
    return { prices: cached.prices, source: 'cache', lastUpdated: new Date(cached.fetchedAt) };
  }

  try {
    const prices = await fetchFromAPI(token);
    await saveCache(prices);
    return { prices, source: 'live', lastUpdated: new Date() };
  } catch {
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
