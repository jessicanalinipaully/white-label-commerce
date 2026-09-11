const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getAuthHeaders(token?: string, host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (host) {
    headers['X-Forwarded-Host'] = host;
  }
  return headers;
}

export interface CustomerProfile {
  id: string;
  storeId: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  user?: { email: string };
  addresses?: CustomerAddress[];
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  storeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export async function fetchCustomerProfile(token: string, host?: string): Promise<CustomerProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/customers/me`, {
      headers: getAuthHeaders(token, host),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function updateCustomerProfile(
  token: string,
  data: Partial<CustomerProfile>,
  host?: string,
): Promise<CustomerProfile | null> {
  const res = await fetch(`${API_BASE}/customers/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function fetchCustomerAddresses(token: string, host?: string): Promise<CustomerAddress[]> {
  try {
    const res = await fetch(`${API_BASE}/customers/me/addresses`, {
      headers: getAuthHeaders(token, host),
      cache: 'no-store',
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function createCustomerAddress(
  token: string,
  data: Omit<CustomerAddress, 'id' | 'customerId' | 'storeId'>,
  host?: string,
): Promise<CustomerAddress> {
  const res = await fetch(`${API_BASE}/customers/me/addresses`, {
    method: 'POST',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create address');
  return res.json();
}

export async function updateCustomerAddress(
  token: string,
  id: string,
  data: Partial<CustomerAddress>,
  host?: string,
): Promise<CustomerAddress> {
  const res = await fetch(`${API_BASE}/customers/me/addresses/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token, host),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update address');
  return res.json();
}

export async function deleteCustomerAddress(token: string, id: string, host?: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/customers/me/addresses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token, host),
  });
  return res.ok;
}
