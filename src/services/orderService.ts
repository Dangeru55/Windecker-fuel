/**
 * Orders against the CRM.
 *
 * The client sends product ids and quantities only — the server re-resolves
 * prices at submission, so an order can never be placed at a price the customer
 * happened to have on screen.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://windecker-crm.up.railway.app';

export type OrderStatus =
  | 'pending' | 'confirmed' | 'scheduled' | 'delivered' | 'rejected' | 'cancelled';

export interface OrderItem {
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrder {
  id: number;
  status: OrderStatus;
  deliveryAddress: string | null;
  notes: string | null;
  scheduledDate: string | null;
  total: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function submitOrder(
  token: string,
  payload: {
    items: { productId: string; quantity: number; name?: string }[];
    destinationId?: number | null;
    deliveryAddress?: string;
    notes?: string;
  }
): Promise<CustomerOrder> {
  const res = await fetch(`${API_BASE_URL}/api/customer/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, 'Could not place order'));
  return res.json();
}

export async function fetchOrders(token: string): Promise<CustomerOrder[]> {
  const res = await fetch(`${API_BASE_URL}/api/customer/orders`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await parseError(res, 'Could not load orders'));
  const data = await res.json();
  return data.orders ?? [];
}

/** Customer-facing wording — internal status names shouldn't leak into the UI. */
export function statusLabel(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'Received';
    case 'confirmed': return 'Confirmed';
    case 'scheduled': return 'Scheduled';
    case 'delivered': return 'Delivered';
    case 'rejected': return 'Needs attention';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
}

export function statusHint(o: CustomerOrder): string {
  switch (o.status) {
    case 'pending': return 'We have your order and will confirm shortly.';
    case 'confirmed': return 'Confirmed — we\'ll follow up with a delivery date.';
    case 'scheduled': return o.scheduledDate ? `Scheduled for ${o.scheduledDate}.` : 'Scheduled for delivery.';
    case 'delivered': return 'Delivered.';
    case 'rejected': return 'We couldn\'t fill this as placed — your rep will be in touch.';
    case 'cancelled': return 'This order was cancelled.';
    default: return '';
  }
}
