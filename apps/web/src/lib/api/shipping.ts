const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getHeaders(token?: string, host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (host) headers['X-Forwarded-Host'] = host;
  return headers;
}

export interface ShippingRate {
  id: string;
  name: string;
  provider: string;
  amount: number;
  currency: string;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
}

export async function fetchShippingRates(host?: string): Promise<ShippingRate[]> {
  try {
    const res = await fetch(`${API_BASE}/shipping/rates`, {
      headers: getHeaders(undefined, host),
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function attachOrderShippingRate(
  token: string,
  orderId: string,
  shippingRateId: string,
  host?: string,
): Promise<any> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/shipping`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify({ shippingRateId }),
  });
  if (!res.ok) throw new Error('Failed to attach shipping rate');
  return res.json();
}
