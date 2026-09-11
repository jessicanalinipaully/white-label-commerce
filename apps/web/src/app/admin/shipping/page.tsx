'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  createAdminShippingRate,
  deleteAdminShippingRate,
  fetchAdminShippingRates,
} from '@/lib/api/admin';

export default function AdminShippingPage() {
  const { token } = useAuth();
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Rate Form
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [amount, setAmount] = useState('');
  const [minDays, setMinDays] = useState('');
  const [maxDays, setMaxDays] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRates = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminShippingRates(token)
      .then(setRates)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRates();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name || !provider || !amount) return;
    setSubmitting(true);
    try {
      await createAdminShippingRate(token, {
        name,
        provider,
        amount: Number(amount),
        estimatedDaysMin: minDays ? Number(minDays) : undefined,
        estimatedDaysMax: maxDays ? Number(maxDays) : undefined,
      });
      setName('');
      setProvider('');
      setAmount('');
      setMinDays('');
      setMaxDays('');
      loadRates();
    } catch (err: any) {
      alert(err.message || 'Failed to create shipping rate');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, rateName: string) => {
    if (!token || !confirm(`Deactivate/delete rate "${rateName}"?`)) return;
    try {
      await deleteAdminShippingRate(token, id);
      loadRates();
    } catch (err: any) {
      alert(err.message || 'Failed to delete shipping rate');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">Shipping Rates</h1>
        <p className="text-sm text-slate-400">Configure store shipping providers and rate options.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Rates List */}
        <div className="md:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Configured Rates</h2>

          {loading ? (
            <p className="text-xs text-slate-400">Loading rates...</p>
          ) : rates.length === 0 ? (
            <p className="text-xs text-slate-500">No shipping rates configured.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {rates.map((rate) => (
                <div key={rate.id} className="py-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{rate.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {rate.provider}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Est. {rate.estimatedDaysMin || 1}-{rate.estimatedDaysMax || 5} days
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-indigo-400">
                      ₹{Number(rate.amount).toLocaleString('en-IN')}
                    </span>
                    <button
                      onClick={() => handleDelete(rate.id, rate.name)}
                      className="text-xs font-bold text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 self-start">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Add Shipping Rate</h2>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Option Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Express Shipping"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Provider *</label>
            <input
              type="text"
              required
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. BlueDart or FedEx"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="99"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Min Days</label>
              <input
                type="number"
                value={minDays}
                onChange={(e) => setMinDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">Max Days</label>
              <input
                type="number"
                value={maxDays}
                onChange={(e) => setMaxDays(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {submitting ? 'Saving...' : 'Save Rate'}
          </button>
        </form>
      </div>
    </div>
  );
}
