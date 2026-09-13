/** Utility for theme styling calculations and map definitions */

export const RADIUS_MAP: Record<string, string> = {
  NONE: '0px',
  SMALL: '0.375rem',
  MEDIUM: '0.75rem',
  LARGE: '1.25rem',
  PILL: '9999px',
};

export const FONT_MAP: Record<string, string> = {
  INTER: "'Inter', sans-serif",
  PLAYFAIR_DISPLAY: "'Playfair Display', serif",
  POPPINS: "'Poppins', sans-serif",
  ROBOTO: "'Roboto', sans-serif",
  MONTSERRAT: "'Montserrat', sans-serif",
};

/**
 * Adjusts brightness of a hex color code by a percentage.
 * Positive percent lightens, negative percent darkens.
 */
export function adjustColorBrightness(hex: string, percent: number): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex || '#4F46E5';
  const cleanHex = hex.slice(1);
  if (cleanHex.length !== 3 && cleanHex.length !== 6) return hex;
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return hex;

  let r = (num >> 16) + Math.round(255 * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round(255 * (percent / 100));
  let b = (num & 0x0000ff) + Math.round(255 * (percent / 100));

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
