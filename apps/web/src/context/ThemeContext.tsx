'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorefrontConfig } from '@commerce/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface ThemeContextType {
  config: StorefrontConfig | null;
  loading: boolean;
  refetchConfig: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  config: null,
  loading: true,
  refetchConfig: async () => {},
});

const RADIUS_MAP: Record<string, string> = {
  NONE: '0px',
  SMALL: '0.375rem',
  MEDIUM: '0.75rem',
  LARGE: '1.25rem',
  PILL: '9999px',
};

const FONT_MAP: Record<string, string> = {
  INTER: "'Inter', sans-serif",
  PLAYFAIR_DISPLAY: "'Playfair Display', serif",
  POPPINS: "'Poppins', sans-serif",
  ROBOTO: "'Roboto', sans-serif",
  MONTSERRAT: "'Montserrat', sans-serif",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StorefrontConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/storefront/config`);
      if (res.ok) {
        const data: StorefrontConfig = await res.json();
        setConfig(data);

        // Apply CSS custom properties dynamically
        const root = document.documentElement;
        const theme = data.theme;
        const branding = data.branding;

        if (theme) {
          root.style.setProperty('--color-primary', theme.primaryColor || '#4F46E5');
          root.style.setProperty('--color-secondary', theme.secondaryColor || '#06B6D4');
          root.style.setProperty('--color-accent', theme.accentColor || '#F59E0B');
          root.style.setProperty('--color-bg', theme.backgroundColor || '#0F172A');
          root.style.setProperty('--color-text', theme.textColor || '#F8FAFC');
          root.style.setProperty('--font-heading', FONT_MAP[theme.headingFont] || 'sans-serif');
          root.style.setProperty('--font-body', FONT_MAP[theme.bodyFont] || 'sans-serif');
          root.style.setProperty('--radius', RADIUS_MAP[theme.borderRadius] || '0.75rem');
        }

        // Apply dynamic page title / favicon if present
        if (branding?.storeDisplayName) {
          document.title = branding.storeDisplayName;
        }
        if (branding?.faviconUrl) {
          let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
          }
          faviconLink.href = branding.faviconUrl;
        }
      }
    } catch (err) {
      console.error('Failed to load storefront theme config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ThemeContext.Provider value={{ config, loading, refetchConfig: fetchConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
