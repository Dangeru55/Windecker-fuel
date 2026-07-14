import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, CartItem, Order, Product } from '../types';
import { MOCK_USERS, MOCK_ORDERS, MOCK_PRODUCTS, PASSWORD } from '../constants';
import { fetchLivePrices, formatLastUpdated, ProductPrice } from '../services/priceService';

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

  const refreshPrices = async () => {
    setPricesLoading(true);
    try {
      const { prices, source, lastUpdated } = await fetchLivePrices();
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
    AsyncStorage.getItem('user').then((data) => {
      if (data) setUser(JSON.parse(data));
    });
    AsyncStorage.getItem('cart')
      .then((data) => {
        if (data) setCart(JSON.parse(data));
      })
      .finally(() => setHydrated(true));
    refreshPrices();
  }, []);

  // Persist the cart on every change. Gated on `hydrated` so the initial empty
  // state can't overwrite a stored cart before it finishes loading.
  useEffect(() => {
    if (hydrated) AsyncStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, hydrated]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && password === PASSWORD
    );
    if (found) {
      setUser(found);
      await AsyncStorage.setItem('user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setCart([]); // the persist effect writes the emptied cart through to storage
    AsyncStorage.removeItem('user');
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
