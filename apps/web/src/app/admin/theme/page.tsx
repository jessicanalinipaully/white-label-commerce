'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminTheme, updateAdminTheme } from '@/lib/api/admin';

const FONTS = ['INTER', 'PLAYFAIR_DISPLAY', 'POPPINS', 'ROBOTO', 'MONTSERRAT'];
const BORDER_RADIUS_OPTIONS = ['NONE', 'SMALL', 'MEDIUM', 'LARGE', 'PILL'];
const BUTTON_STYLES = ['SOLID', 'OUTLINE', 'ROUNDED'];

export default function AdminThemePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#06B6D4');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [backgroundColor, setBackgroundColor] = useState('#0F172A');
  const [textColor, setTextColor] = useState('#F8FAFC');
  const [headingFont, setHeadingFont] = useState('INTER');
  const [bodyFont, setBodyFont] = useState('INTER');
  const [borderRadius, setBorderRadius] = useState('MEDIUM');
  const [buttonStyle, setButtonStyle] = useState('SOLID');

  const loadTheme = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminTheme(token)
      .then((theme) => {
        if (theme) {
          setPrimaryColor(theme.primaryColor || '#4F46E5');
          setSecondaryColor(theme.secondaryColor || '#06B6D4');
          setAccentColor(theme.accentColor || '#F59E0B');
          setBackgroundColor(theme.backgroundColor || '#0F172A');
          setTextColor(theme.textColor || '#F8FAFC');
          setHeadingFont(theme.headingFont || 'INTER');
          setBodyFont(theme.bodyFont || 'INTER');
          setBorderRadius(theme.borderRadius || 'MEDIUM');
          setButtonStyle(theme.buttonStyle || 'SOLID');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTheme();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await updateAdminTheme(token, {
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        headingFont,
        bodyFont,
        borderRadius,
        buttonStyle,
      });
      alert('Theme styling updated successfully');
      loadTheme();
    } catch (err: any) {
      alert(err.message || 'Failed to update theme');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Theme Styling</h1>
        <p className="text-sm text-slate-400">Configure store colors, typography, border radius, and button styles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Theme Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Color Palette</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Secondary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Accent Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Background Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider pt-4 border-t border-slate-800">
            Typography & Style
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Heading Font</label>
              <select
                value={headingFont}
                onChange={(e) => setHeadingFont(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Body Font</label>
              <select
                value={bodyFont}
                onChange={(e) => setBodyFont(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                {FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Border Radius</label>
              <select
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                {BORDER_RADIUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Button Style</label>
              <select
                value={buttonStyle}
                onChange={(e) => setButtonStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
              >
                {BUTTON_STYLES.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
            >
              {saving ? 'Saving...' : 'Save Theme Settings'}
            </button>
          </div>
        </form>

        {/* Live Component Preview */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 self-start">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Live Preview</h2>
          <div
            className="p-6 border rounded-xl space-y-4"
            style={{
              backgroundColor: backgroundColor,
              color: textColor,
            }}
          >
            <h3 className="text-xl font-bold" style={{ color: primaryColor }}>
              Store Banner
            </h3>
            <p className="text-xs" style={{ color: textColor }}>
              Preview text displaying body font and color variables.
            </p>

            <button
              className="px-4 py-2 text-xs font-bold text-white"
              style={{
                backgroundColor: primaryColor,
                borderRadius:
                  borderRadius === 'PILL'
                    ? '9999px'
                    : borderRadius === 'LARGE'
                    ? '1.25rem'
                    : borderRadius === 'SMALL'
                    ? '0.375rem'
                    : borderRadius === 'NONE'
                    ? '0px'
                    : '0.75rem',
              }}
            >
              Primary Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
