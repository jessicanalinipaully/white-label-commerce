'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StorefrontConfig } from '@commerce/types';
import { fetchStorefrontConfig } from '@/lib/api/storefront';
import { adjustColorBrightness, FONT_MAP, RADIUS_MAP } from '@/lib/theme';

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

function applyThemeVariables(data: StorefrontConfig) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const theme = data.theme;
  const branding = data.branding;

  if (theme) {
    const primary = theme.primaryColor || '#4F46E5';
    const primaryHover = theme.primaryColor ? adjustColorBrightness(theme.primaryColor, -10) : '#4338CA';
    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-primary-hover', primaryHover);
    root.style.setProperty('--color-secondary', theme.secondaryColor || '#06B6D4');
    root.style.setProperty('--color-accent', theme.accentColor || '#F59E0B');
    root.style.setProperty('--color-bg', theme.backgroundColor || '#0F172A');
    root.style.setProperty('--color-text', theme.textColor || '#F8FAFC');
    root.style.setProperty('--font-heading', FONT_MAP[theme.headingFont] || 'sans-serif');
    root.style.setProperty('--font-body', FONT_MAP[theme.bodyFont] || 'sans-serif');
    root.style.setProperty('--radius', RADIUS_MAP[theme.borderRadius] || '0.75rem');
  }

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

export function ThemeProvider({
  children,
  initialConfig = null,
}: {
  children: React.ReactNode;
  initialConfig?: StorefrontConfig | null;
}) {
  const [config, setConfig] = useState<StorefrontConfig | null>(initialConfig);
  const [loading, setLoading] = useState(!initialConfig);

  const refetchConfig = async () => {
    try {
      const data = await fetchStorefrontConfig();
      if (data) {
        setConfig(data);
        applyThemeVariables(data);
      }
    } catch (err) {
      console.error('Failed to load storefront theme config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialConfig) {
      applyThemeVariables(initialConfig);
    }
    refetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ config, loading, refetchConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

