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

export interface Destination {
  id: number;
  name: string;
  area: string | null;
  isPrimary: boolean;
}

export interface ProductPrice {
  id: string;
  name: string;
  unit: string;
  price: number;
  updatedAt: string; // ISO date string
}

interface PriceCache {
  prices: ProductPrice[];
  destinations: Destination[];
  destinationId: number | null;
  fetchedAt: number;
}

// ── Fetch from API ───────────────────────────────────────────────────────────
async function fetchFromAPI(
  token: string,
  destinationId?: number | null
): Promise<{ prices: ProductPrice[]; destinations: Destination[]; destinationId: number | null }> {
  const qs = destinationId ? `?destinationId=${destinationId}` : '';
  const res = await fetch(`${API_BASE_URL}/api/customer/prices${qs}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Price API returned ${res.status}`);
  const data = await res.json();
  return {
    prices: (data.prices as { id: string; name: string; unit: string; price: number }[]).map((p) => ({
      ...p,
      updatedAt: data.updatedAt,
    })),
    destinations: (data.destinations as Destination[]) ?? [],
    destinationId: data.destinationId ?? null,
  };
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

async function saveCache(
  prices: ProductPrice[],
  destinations: Destination[],
  destinationId: number | null
) {
  const cache: PriceCache = { prices, destinations, destinationId, fetchedAt: Date.now() };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

// ── Main export ──────────────────────────────────────────────────────────────
/**
 * Returns the logged-in customer's live prices (from API or fresh cache).
 * Falls back to stale cache or empty if completely offline.
 */
export async function fetchLivePrices(
  token: string,
  destinationId?: number | null
): Promise<{
  prices: ProductPrice[];
  destinations: Destination[];
  destinationId: number | null;
  source: 'live' | 'cache' | 'offline';
  lastUpdated: Date | null;
}> {
  const cached = await getCached();
  const cacheAge = cached ? Date.now() - cached.fetchedAt : Infinity;
  // A different site has different freight and margin, so a cache entry is only
  // usable for the destination it was fetched for.
  const cacheUsable =
    cached && (!destinationId || cached.destinationId === destinationId);

  if (cached && cacheUsable && cacheAge < CACHE_TTL_MS) {
    return {
      prices: cached.prices,
      destinations: cached.destinations ?? [],
      destinationId: cached.destinationId ?? null,
      source: 'cache',
      lastUpdated: new Date(cached.fetchedAt),
    };
  }

  try {
    const res = await fetchFromAPI(token, destinationId);
    await saveCache(res.prices, res.destinations, res.destinationId);
    return { ...res, source: 'live', lastUpdated: new Date() };
  } catch {
    if (cached && cacheUsable) {
      return {
        prices: cached.prices,
        destinations: cached.destinations ?? [],
        destinationId: cached.destinationId ?? null,
        source: 'cache',
        lastUpdated: new Date(cached.fetchedAt),
      };
    }
    return { prices: [], destinations: [], destinationId: null, source: 'offline', lastUpdated: null };
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
