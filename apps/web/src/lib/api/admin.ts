const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getHeaders(token?: string, host?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (host) headers['X-Forwarded-Host'] = host;
  return headers;
}

async function request(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

/** Dashboard */
export async function fetchAdminDashboard(token: string, host?: string) {
  return request(`${API_BASE}/admin/dashboard`, {
    headers: getHeaders(token, host),
  });
}

/** Products */
export async function fetchAdminProducts(
  token: string,
  query: { page?: number; limit?: number; search?: string; categoryId?: string } = {},
  host?: string,
) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);

  return request(`${API_BASE}/admin/products?${params.toString()}`, {
    headers: getHeaders(token, host),
  });
}

export async function fetchAdminProductById(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/products/${id}`, {
    headers: getHeaders(token, host),
  });
}

export async function createAdminProduct(token: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/products`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function updateAdminProduct(token: string, id: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/products/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function deleteAdminProduct(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token, host),
  });
}

/** Categories */
export async function fetchAdminCategories(token: string, host?: string) {
  return request(`${API_BASE}/admin/categories`, {
    headers: getHeaders(token, host),
  });
}

export async function createAdminCategory(token: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/categories`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function updateAdminCategory(token: string, id: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/categories/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function deleteAdminCategory(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/categories/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token, host),
  });
}

/** Variants */
export async function fetchAdminVariants(token: string, productId: string, host?: string) {
  return request(`${API_BASE}/admin/products/${productId}/variants`, {
    headers: getHeaders(token, host),
  });
}

export async function createAdminVariant(
  token: string,
  productId: string,
  data: any,
  host?: string,
) {
  return request(`${API_BASE}/admin/products/${productId}/variants`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function updateAdminVariant(token: string, id: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/variants/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function deleteAdminVariant(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/variants/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token, host),
  });
}

/** Inventory */
export async function fetchAdminInventory(
  token: string,
  query: { page?: number; limit?: number; lowStockOnly?: boolean } = {},
  host?: string,
) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.lowStockOnly) params.set('lowStockOnly', 'true');

  return request(`${API_BASE}/admin/inventory?${params.toString()}`, {
    headers: getHeaders(token, host),
  });
}

export async function updateAdminInventory(
  token: string,
  variantId: string,
  data: { quantity?: number; lowStockThreshold?: number },
  host?: string,
) {
  return request(`${API_BASE}/admin/inventory/${variantId}`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function adjustAdminInventory(
  token: string,
  variantId: string,
  data: { adjustmentQuantity: number; reason?: string },
  host?: string,
) {
  return request(`${API_BASE}/admin/inventory/${variantId}/adjust`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

/** Orders */
export async function fetchAdminOrders(
  token: string,
  query: { page?: number; limit?: number; status?: string; paymentStatus?: string; search?: string } = {},
  host?: string,
) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.status) params.set('status', query.status);
  if (query.paymentStatus) params.set('paymentStatus', query.paymentStatus);
  if (query.search) params.set('search', query.search);

  return request(`${API_BASE}/admin/orders?${params.toString()}`, {
    headers: getHeaders(token, host),
  });
}

export async function fetchAdminOrderById(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/orders/${id}`, {
    headers: getHeaders(token, host),
  });
}

export async function updateAdminOrderStatus(
  token: string,
  id: string,
  status: string,
  host?: string,
) {
  return request(`${API_BASE}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify({ status }),
  });
}

/** Customers */
export async function fetchAdminCustomers(
  token: string,
  query: { page?: number; limit?: number; search?: string } = {},
  host?: string,
) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', query.page.toString());
  if (query.limit) params.set('limit', query.limit.toString());
  if (query.search) params.set('search', query.search);

  return request(`${API_BASE}/admin/customers?${params.toString()}`, {
    headers: getHeaders(token, host),
  });
}

export async function fetchAdminCustomerById(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/customers/${id}`, {
    headers: getHeaders(token, host),
  });
}

/** Shipping Rates */
export async function fetchAdminShippingRates(token: string, host?: string) {
  return request(`${API_BASE}/admin/shipping-rates`, {
    headers: getHeaders(token, host),
  });
}

export async function createAdminShippingRate(token: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/shipping-rates`, {
    method: 'POST',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function updateAdminShippingRate(token: string, id: string, data: any, host?: string) {
  return request(`${API_BASE}/admin/shipping-rates/${id}`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}

export async function deleteAdminShippingRate(token: string, id: string, host?: string) {
  return request(`${API_BASE}/admin/shipping-rates/${id}`, {
    method: 'DELETE',
    headers: getHeaders(token, host),
  });
}

/** Store Settings */
export async function fetchAdminStore(token: string, host?: string) {
  return request(`${API_BASE}/admin/store`, {
    headers: getHeaders(token, host),
  });
}

export async function updateAdminStore(token: string, data: { name?: string; slug?: string }, host?: string) {
  return request(`${API_BASE}/admin/store`, {
    method: 'PATCH',
    headers: getHeaders(token, host),
    body: JSON.stringify(data),
  });
}
