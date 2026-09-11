const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeaders(token: string, host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (host) {
    headers['X-Forwarded-Host'] = host;
  }
  return headers;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  productImageUrl?: string | null;
}

export interface Order {
  id: string;
  storeId: string;
  customerId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number | string;
  shippingAmount: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  total: number | string;
  currency: string;
  shippingAddressSnapshot: any;
  billingAddressSnapshot: any;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
}

export async function executeCheckout(
  token: string,
  data: { shippingAddressId: string; billingAddressId?: string; notes?: string },
  host?: string,
): Promise<Order> {
  const res = await fetch(`${API_BASE}/checkout`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Checkout failed');
  }

  return res.json();
}

export async function fetchCustomerOrders(
  token: string,
  page = 1,
  limit = 20,
  host?: string,
): Promise<{ data: Order[]; total: number; page: number; limit: number; totalPages: number }> {
  const res = await fetch(`${API_BASE}/orders?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token, host),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json();
}

export async function fetchCustomerOrderById(token: string, orderId: string, host?: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: getAuthHeaders(token, host),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
