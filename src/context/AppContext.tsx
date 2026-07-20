import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CartItem, Order, Product } from '../types';
import { MOCK_ORDERS, MOCK_PRODUCTS } from '../constants';
import { fetchLivePrices, formatLastUpdated, invalidatePriceCache, ProductPrice } from '../services/priceService';
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
  };
}

interface AppContextType {
  user: User | null;
  cart: CartItem[];
  orders: Order[];
  products: Product[];
  priceStatus: string;
  pricesLoading: boolean;
  refreshPrices: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
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
  const [hydrated, setHydrated] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const refreshPrices = async (authToken?: string) => {
    const t = authToken ?? token;
    if (!t) return; // no session yet — nothing to price
    setPricesLoading(true);
    try {
      const { prices, source, lastUpdated } = await fetchLivePrices(t);
      if (prices.length > 0) {
        // Merge live prices into products
        setProducts((prev) =>
          prev.map((p) => {
            const live = prices.find((lp: ProductPrice) => lp.id === p.id);
            return live ? { ...p, price: live.price } : p;
          })
        );
      }
      setPriceStatus(
        source === 'offline'
          ? '⚠️ Showing cached prices — check connection'
          : formatLastUpdated(lastUpdated)
      );
    } catch {
      setPriceStatus('⚠️ Could not load prices');
    } finally {
      setPricesLoading(false);
    }
  };

  useEffect(() => {
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

  const logout = () => {
    setUser(null);
    setToken(null);
    setCart([]); // the persist effect writes the emptied cart through to storage
    setProducts(MOCK_PRODUCTS); // clear the previous customer's resolved prices
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
        login, logout, addToCart, removeFromCart, updateCartQuantity, clearCart,
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
