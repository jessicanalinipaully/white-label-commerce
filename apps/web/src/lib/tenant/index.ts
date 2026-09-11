/**
 * Tenant utilities — derive the current store's host from browser/server context.
 * NEVER uses query params or hardcoded IDs.
 */

/** Normalize a raw hostname: strip port, lowercase, trim */
export function normalizeHost(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/:\d+$/, '')
    .replace(/\/+$/, '');
}

/** Get the current host in a browser context */
export function getClientHost(): string {
  if (typeof window === 'undefined') return '';
  return normalizeHost(window.location.hostname);
}
