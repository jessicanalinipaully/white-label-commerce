const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getHeaders(token: string, host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (host) headers['X-Forwarded-Host'] = host;
  return headers;
}

export interface PaymentOrderResponse {
  paymentId: string;
  provider: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export interface VerifyPaymentPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function createPaymentOrder(
  token: string,
  orderId: string,
  host?: string,
): Promise<PaymentOrderResponse> {
  const res = await fetch(`${API_BASE}/payments/orders/${orderId}/create`, {
    method: 'POST',
    headers: getHeaders(token, host),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to initiate payment');
  }
  return res.json();
}

export async function verifyPayment(
  token: string,
  payload: VerifyPaymentPayload,
  host?: string,
): Promise<{ success: boolean; orderId: string; paymentId: string }> {
  const res = await fetch(`${API_BASE}/payments/verify`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Payment verification failed');
  }
  return res.json();
}
