/**
 * Customer authentication against the Windecker CRM's customer portal.
 * One login per company — replaces the old MOCK_USERS demo login.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://windecker-crm.up.railway.app';
const TOKEN_KEY = 'customer_token';

export interface PortalCustomer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface LoginResponse {
  token: string;
  customer: PortalCustomer;
}

export async function login(email: string, password: string): Promise<PortalCustomer> {
  const res = await fetch(`${API_BASE_URL}/api/customer-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Invalid email or password');
  }
  const data: LoginResponse = await res.json();
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.customer;
}

export async function logout() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/** Re-fetch the logged-in customer's profile using the stored token (session restore). */
export async function fetchMe(token: string): Promise<PortalCustomer | null> {
  const res = await fetch(`${API_BASE_URL}/api/customer-auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}
