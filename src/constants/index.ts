import { Product, User, Order } from '../types';

export const COLORS = {
  primary: '#00A99D',
  primaryDark: '#007F76',
  primaryLight: '#33BDB8',
  accent: '#F59E0B',
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  muted: '#F1F5F9',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  card: '#FFFFFF',
};

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    company: 'Smith Farms LLC',
    phone: '(555) 123-4567',
    entityType: 'ag',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    company: 'Johnson Transport',
    entityType: 'commercial',
    phone: '(555) 987-6543',
  },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Diesel #2',
    description: 'Standard diesel fuel for trucks and farm equipment',
    price: 3.89,
    unit: 'gallon',
    category: 'Diesel',
  },
  {
    id: '2',
    name: 'Off-Road Diesel',
    description: 'Dyed diesel for off-road equipment, tax exempt',
    price: 3.45,
    unit: 'gallon',
    category: 'Diesel',
  },
  {
    id: '3',
    name: 'Regular Unleaded 87',
    description: 'Standard gasoline for passenger vehicles',
    price: 3.29,
    unit: 'gallon',
    category: 'Gasoline',
  },
  {
    id: '4',
    name: 'Premium Unleaded 93',
    description: 'High-octane premium gasoline',
    price: 3.79,
    unit: 'gallon',
    category: 'Gasoline',
  },
  {
    id: '5',
    name: 'Propane',
    description: 'LP gas for heating and equipment',
    price: 1.89,
    unit: 'gallon',
    category: 'Propane',
  },
  {
    id: '6',
    name: 'DEF Fluid',
    description: 'Diesel exhaust fluid for emissions compliance',
    price: 12.99,
    unit: '2.5 gal jug',
    category: 'Additives',
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2024-001',
    date: '2024-01-15',
    items: [
      { product: MOCK_PRODUCTS[0], quantity: 500 },
      { product: MOCK_PRODUCTS[5], quantity: 4 },
    ],
    total: 1997.96,
    status: 'delivered',
    deliveryAddress: '1234 Farm Road, Rural County, TX 78901',
  },
  {
    id: 'ORD-2024-002',
    date: '2024-01-28',
    items: [{ product: MOCK_PRODUCTS[1], quantity: 300 }],
    total: 1035.0,
    status: 'processing',
    deliveryAddress: '1234 Farm Road, Rural County, TX 78901',
  },
];

export const PASSWORD = 'password';
