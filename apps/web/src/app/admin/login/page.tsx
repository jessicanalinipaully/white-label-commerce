'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminDashboard } from '@/lib/api/admin';
import { getClientHost } from '@/lib/tenant';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { token, setToken, setUser } = useAuth();
  const router = useRouter();

  // If already authenticated with valid admin role, redirect to /admin
  useEffect(() => {
    if (!token) return;
    const host = getClientHost();
    fetchAdminDashboard(token, host)
      .then(() => {
        router.push('/admin');
      })
      .catch(() => {
        // Token invalid or non-admin, stay on login page
      });
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const host = getClientHost();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(host ? { 'X-Forwarded-Host': host } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid email or password');
      }

      const authData = await res.json();
      const accessToken = authData.accessToken;

      // Verify authorized store role via backend admin endpoint
      try {
        await fetchAdminDashboard(accessToken, host);
      } catch (adminErr: any) {
        if (adminErr.status === 403) {
          throw new Error('Access Denied: Your account does not have administrator permissions for this store.');
        }
        throw adminErr;
      }

      // Store auth state and redirect to admin dashboard
      setToken(accessToken, authData.user);
      if (authData.user) setUser(authData.user);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-scope min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            🛡️ Admin Console Access
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Store Administrator Login</h1>
          <p className="text-sm text-slate-400">
            Sign in with your administrative credentials to manage store catalog, inventory, and operations.
          </p>
        </div>

        {/* Login Form Card */}
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-start gap-3">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Admin Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@urbanthread.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Admin Console →</span>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer Note */}
        <div className="text-center text-xs text-slate-500">
          <p>Strict RBAC & Tenant Isolation Active</p>
          <p className="mt-1 text-[11px] text-slate-600">
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
