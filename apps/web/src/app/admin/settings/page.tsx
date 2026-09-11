'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminStore, updateAdminStore } from '@/lib/api/admin';

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [store, setStore] = useState<any>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStore = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminStore(token)
      .then((res) => {
        setStore(res);
        setName(res.name);
        setSlug(res.slug);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStore();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await updateAdminStore(token, { name, slug });
      alert('Store settings updated successfully');
      loadStore();
    } catch (err: any) {
      alert(err.message || 'Failed to update store settings');
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
        <h1 className="text-2xl font-black text-white">Store Settings</h1>
        <p className="text-sm text-slate-400">Basic store profile configuration for current tenant.</p>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">General Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Store Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Store Slug</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Configured Domains */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Associated Domains</h3>
          <div className="space-y-2">
            {store?.domains?.map((domain: any) => (
              <div
                key={domain.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
              >
                <span className="font-mono text-white">{domain.domain}</span>
                {domain.isPrimary && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
