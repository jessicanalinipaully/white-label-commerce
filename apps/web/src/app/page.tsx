'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedDomain, setSelectedDomain] = useState('urbanthread.localhost');
  const [email, setEmail] = useState('alice@urbanthread.com');
  const [password, setPassword] = useState('Password123!');
  const [token, setToken] = useState<string | null>(null);
  const [tenantData, setTenantData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Login failed');
      }
      const data = await res.json();
      setToken(data.accessToken);
      setTenantData(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenant = async () => {
    if (!token) {
      setError('Please login first to get an authentication token');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${baseUrl}/tenant`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Forwarded-Host': selectedDomain,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Error ${res.status}`);
      }
      setTenantData(data);
    } catch (err: any) {
      setError(err.message);
      setTenantData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="max-w-2xl w-full p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-4 w-4 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Phase 2 Multi-Tenancy Foundation
          </span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
          White Label Commerce Platform
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          Server-side tenant resolution and security isolation test page.
        </p>

        {/* Credentials presets */}
        <div className="mb-6 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
          <label className="text-xs font-semibold text-slate-400 block">Quick Preset Selector:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setEmail('alice@urbanthread.com');
                setSelectedDomain('urbanthread.localhost');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-indigo-300"
            >
              Alice @ UrbanThread
            </button>
            <button
              onClick={() => {
                setEmail('bob@aurelia.com');
                setSelectedDomain('aurelia.localhost');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-purple-300"
            >
              Bob @ Aurelia
            </button>
            <button
              onClick={() => {
                setEmail('alice@urbanthread.com');
                setSelectedDomain('aurelia.localhost');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-950 hover:bg-red-900 text-red-300"
            >
              Alice @ Aurelia (Unauthorized Test)
            </button>
          </div>
        </div>

        {/* Input form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">Target Host/Domain:</label>
            <input
              type="text"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">User Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 py-3 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              1. Login & Get JWT Token
            </button>
            <button
              onClick={fetchTenant}
              disabled={loading || !token}
              className="flex-1 py-3 rounded-xl font-medium text-sm text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              2. Call GET /api/tenant
            </button>
          </div>
        </div>

        {/* Display Status */}
        {token && (
          <div className="mb-4 text-xs font-mono text-emerald-400 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-800/40">
            JWT Token Active
          </div>
        )}

        {error && (
          <div className="p-4 mb-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm">
            <p className="font-semibold mb-1">Error Response</p>
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {tenantData && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Tenant Context Resolved
              </span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-3 bg-slate-900 rounded-lg border border-slate-800">
              {JSON.stringify(tenantData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
