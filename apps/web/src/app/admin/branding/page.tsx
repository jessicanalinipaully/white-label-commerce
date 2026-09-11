'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminBranding, updateAdminBranding } from '@/lib/api/admin';

export default function AdminBrandingPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [storeDisplayName, setStoreDisplayName] = useState('');
  const [tagline, setTagline] = useState('');
  const [socialPreviewImageUrl, setSocialPreviewImageUrl] = useState('');

  const loadBranding = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminBranding(token)
      .then((branding) => {
        if (branding) {
          setLogoUrl(branding.logoUrl || '');
          setFaviconUrl(branding.faviconUrl || '');
          setStoreDisplayName(branding.storeDisplayName || '');
          setTagline(branding.tagline || '');
          setSocialPreviewImageUrl(branding.socialPreviewImageUrl || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadBranding();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await updateAdminBranding(token, {
        logoUrl: logoUrl || undefined,
        faviconUrl: faviconUrl || undefined,
        storeDisplayName: storeDisplayName || undefined,
        tagline: tagline || undefined,
        socialPreviewImageUrl: socialPreviewImageUrl || undefined,
      });
      alert('Branding updated successfully');
      loadBranding();
    } catch (err: any) {
      alert(err.message || 'Failed to update branding');
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
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Store Branding</h1>
        <p className="text-sm text-slate-400">Configure logo, favicon, display name, and tagline.</p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Brand Identity</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Store Display Name</label>
            <input
              type="text"
              value={storeDisplayName}
              onChange={(e) => setStoreDisplayName(e.target.value)}
              placeholder="e.g. UrbanThread Official Store"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Premium Sustainable Fashion & Apparel"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Logo URL</label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Favicon URL</label>
            <input
              type="url"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Social Preview Image URL</label>
            <input
              type="url"
              value={socialPreviewImageUrl}
              onChange={(e) => setSocialPreviewImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
}
