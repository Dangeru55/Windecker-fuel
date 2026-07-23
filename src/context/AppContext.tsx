import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CartItem, Order, Product } from '../types';
import { MOCK_ORDERS, MOCK_PRODUCTS } from '../constants';
import { fetchLivePrices, formatLastUpdated, invalidatePriceCache, ProductPrice, Destination } from '../services/priceService';
import * as authService from '../services/authService';

// CRM customer -> app User. One login per company: `name` is the company
// name (not a person), so screens greeting "the user" should read it as such.
function toAppUser(customer: authService.PortalCustomer): User {
  return {
    id: String(customer.id),
    name: customer.name,
    email: customer.email,
    company: customer.name,
    phone: customer.phone ?? '',
    // Default to commercial if the CRM didn't say — the safer bias, since a
    // miscategorised gas station missing a product is better than a commercial
    // account being shown fuel-only.
    entityType: customer.entityType ?? 'commercial',
  };
}

// Cosmetic copy (category + description) for products not in the original
// hardcoded set. The CRM is the source of truth for WHICH products exist and
// their prices — new products (e.g. a renewable blend added mid-season)
// should appear automatically without an app update, just with generic copy
// until someone writes something nicer.
function deriveCopy(name: string): { category: string; description: string } {
  const n = name.toLowerCase();
  // Check renewable/bio before the generic "dyed" match — "R99 Dyed" is a
  // renewable diesel variant, not off-road diesel, even though it contains "dyed".
  if (n.includes('r99') || n.includes('r95') || n.includes('renew'))
    return { category: 'Renewable Diesel', description: 'Renewable diesel blend' };
  if (n.includes('off-road') || n.includes('off road') || n.includes('dyed'))
    return { category: 'Diesel', description: 'Dyed diesel for off-road equipment, tax exempt' };
  if (n.includes('diesel') || n.includes('dsl'))
    return { category: 'Diesel', description: 'Diesel fuel for trucks and equipment' };
  if (n.includes('b20') || n.includes('b99') || n.includes('bio'))
    return { category: 'Biodiesel', description: 'Biodiesel blend' };
  if (n.includes('regular') || n.includes('premium') || n.includes('mid') || n.includes('unleaded'))
    return { category: 'Gasoline', description: 'Gasoline for vehicles and equipment' };
  if (n.includes('propane')) return { category: 'Propane', description: 'LP gas for heating and equipment' };
  if (n.includes('def')) return { category: 'Additives', description: 'Diesel exhaust fluid for emissions compliance' };
  return { category: 'Fuel', description: name };
}

// Build the app's product list directly from the customer's live prices
// (the CRM's source-of-truth catalog), instead of only overlaying price onto
// a fixed hardcoded list. Products priced in the CRM but missing from
// MOCK_PRODUCTS (e.g. renewable blends added after this app shipped) were
// previously dropped silently — this makes anything priced show up.
function buildProductsFromPrices(prices: ProductPrice[]): Product[] {
  return prices.map((p) => {
    const known = MOCK_PRODUCTS.find((mp) => mp.id === p.id);
    const copy = known ? { category: known.category, description: known.description } : deriveCopy(p.name ?? '');
    return {
      id: p.id,
      name: p.name ?? known?.name ?? `Product ${p.id}`,
      unit: p.unit ?? known?.unit ?? 'gallon',
      price: p.price,
      ...copy,
    };
  });
}

interface AppContextType {
  user: User | null;
  cart: CartItem[];
  orders: Order[];
  products: Product[];
  priceStatus: string;
  pricesLoading: boolean;
  refreshPrices: () => Promise<void>;
  destinations: Destination[];
  destinationId: number | null;
  selectDestination: (id: number) => void;
  isPreview: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  createAccount: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (address: string) => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [priceStatus, setPriceStatus] = useState('');
  const [pricesLoading, setPricesLoading] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const refreshPrices = async (authToken?: string, force = false, destId?: number | null) => {
    const t = authToken ?? token;
    if (!t) return; // no session yet — nothing to price
    if (force) await invalidatePriceCache(); // bypass the TTL — a foreground open should always show today's prices
    setPricesLoading(true);
    try {
      const target = destId !== undefined ? destId : destinationId;
      const { prices, source, lastUpdated, destinations: dests, destinationId: resolvedDestId, stale } =
        await fetchLivePrices(t, target);
      setDestinations(dests);
      setDestinationId(resolvedDestId);
      if (prices.length > 0) {
        setProducts(buildProductsFromPrices(prices));
      }
      // `stale` means the CRM's own rack feed missed a day — the prices are
      // genuinely old, not just our cache. Say so rather than presenting them
      // as today's, since the customer would be quoted a number we can't honour.
      setPriceStatus(
        source === 'offline'
          ? '⚠️ Showing cached prices — check connection'
          : stale
            ? '⚠️ Prices may be out of date — confirm before ordering'
            : formatLastUpdated(lastUpdated)
      );
    } catch {
      setPriceStatus('⚠️ Could not load prices');
    } finally {
      setPricesLoading(false);
    }
  };

  // Switching delivery site re-quotes from the CRM: freight and margin are set
  // per destination, so prices are not interchangeable between a customer's sites.
  const selectDestination = (id: number) => {
    setDestinationId(id);
    refreshPrices(undefined, true, id);
  };

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  useEffect(() => {
    // A customer who left the app open overnight, or backgrounded it, should
    // see today's prices the moment they come back — not whatever was cached
    // when they last opened it. Re-fetching on every foreground (in addition
    // to the 15-min TTL and pull-to-refresh) is what makes "upload at 7am"
    // actually reach the customer instead of silently waiting on a timer.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && tokenRef.current) refreshPrices(tokenRef.current, true);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // A manager opening "view as customer" from the CRM arrives with a
    // short-lived preview token in the URL. Use it for this tab only — never
    // persisted, so it can't outlive the visit or displace a real customer's
    // session on a shared device.
    const previewToken =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('preview')
        : null;

    if (previewToken) {
      authService.fetchMe(previewToken).then((customer) => {
        if (!customer) return;
        setToken(previewToken);
        setUser(toAppUser(customer));
        setIsPreview(true);
        refreshPrices(previewToken);
        // Drop the token from the address bar so it isn't shared by copy-paste.
        window.history.replaceState({}, '', window.location.pathname);
      });
      return;
    }

    // Restore session: a stored token means we're logged in as a customer —
    // re-validate it against the CRM rather than trusting a cached user object.
    authService.getToken().then(async (t) => {
      if (!t) return;
      const customer = await authService.fetchMe(t);
      if (customer) {
        setToken(t);
        setUser(toAppUser(customer));
        refreshPrices(t);
      } else {
        await authService.logout(); // token expired/revoked
      }
    });
    AsyncStorage.getItem('cart')
      .then((data) => {
        if (data) setCart(JSON.parse(data));
      })
      .finally(() => setHydrated(true));
  }, []);

  // Persist the cart on every change. Gated on `hydrated` so the initial empty
  // state can't overwrite a stored cart before it finishes loading.
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, hydrated]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const customer = await authService.login(email, password);
      const t = await authService.getToken();
      setToken(t);
      setUser(toAppUser(customer));
      if (t) refreshPrices(t);
      return true;
    } catch {
      return false;
    }
  };

  // Unlike login, throws with a specific message (email not whitelisted /
  // already claimed / etc.) so the screen can show exactly what went wrong.
  const createAccount = async (email: string, password: string): Promise<void> => {
    const customer = await authService.createAccount(email, password);
    const t = await authService.getToken();
    setToken(t);
    setUser(toAppUser(customer));
    if (t) refreshPrices(t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCart([]); // the persist effect writes the emptied cart through to storage
    setProducts(MOCK_PRODUCTS); // clear the previous customer's resolved prices
    setDestinations([]);
    setDestinationId(null);
    authService.logout();
    invalidatePriceCache(); // a different company logging in on this device must not see stale prices
  };

  // Functional updates throughout: callers may invoke these in a loop (e.g. reorder
  // adds every line item), and each call must see the result of the previous one
  // rather than the cart captured in the render closure.
  const addToCart = (product: Product, quantity: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  };

  const clearCart = () => setCart([]);

  const placeOrder = (address: string) => {
    // Read-only: a manager looking at a customer's account must not be able to
    // place an order in that customer's name.
    if (isPreview) return;
    const order: Order = {
      id: `ORD-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cart],
      total: cartTotal,
      status: 'pending',
      deliveryAddress: address,
    };
    setOrders([order, ...orders]);
    clearCart();
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        user, cart, orders, products, priceStatus, pricesLoading, refreshPrices,
        destinations, destinationId, selectDestination, isPreview,
        login, createAccount, logout, addToCart, removeFromCart, updateCartQuantity, clearCart,
        placeOrder, cartTotal, cartCount,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
