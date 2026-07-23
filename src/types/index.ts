export type EntityType = 'gas_station' | 'commercial' | 'ag';

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  // Determines which order screen the customer gets — a gas station and a
  // commercial/ag account see different catalogues, never each other's.
  entityType: EntityType;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  deliveryAddress: string;
}

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  Cart: undefined;
  Orders: undefined;
  Account: undefined;
};
