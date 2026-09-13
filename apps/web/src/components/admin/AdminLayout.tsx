'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminDashboard } from '@/lib/api/admin';
import { getClientHost } from '@/lib/tenant';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { token, logout, setUser } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated' | 'forbidden' | 'error'>(
    isLoginPage ? 'unauthenticated' : 'checking'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      setAuthStatus('unauthenticated');
      return;
    }

    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);

    if (!currentToken) {
      setAuthStatus('unauthenticated');
      router.push('/admin/login');
      return;
    }

    const host = getClientHost();
    setAuthStatus('checking');

    fetchAdminDashboard(currentToken, host)
      .then((data) => {
        setAuthStatus('authenticated');
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch((err: any) => {
        if (err.status === 401) {
          logout();
          setAuthStatus('unauthenticated');
          router.push('/admin/login');
        } else if (err.status === 403) {
          setAuthStatus('forbidden');
        } else {
          setAuthStatus('error');
          setErrorMessage(err.message || 'Failed to verify admin authorization');
        }
      });
  }, [pathname, token, isLoginPage, router, logout, setUser]);

  // If visiting /admin/login, render login page directly without admin sidebar/header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Render loading state while checking authentication/authorization
  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Verifying admin authentication & permissions...</p>
      </div>
    );
  }

  // Render loading/redirecting state if unauthenticated
  if (authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-300 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-300">Redirecting to admin login...</p>
      </div>
    );
  }

  // Render 403 Access Denied screen if user is authenticated but not an authorized store admin
  if (authStatus === 'forbidden') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-3xl mb-6 shadow-xl">
          🚫
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">403 — Access Denied</h1>
        <p className="text-sm text-slate-400 mt-3 max-w-md leading-relaxed">
          Your authenticated user account does not have store administrator permissions for this store.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              logout();
              router.push('/admin/login');
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm transition-colors shadow-lg shadow-indigo-600/20"
          >
            Sign In with Different Account
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 font-bold text-slate-300 text-sm transition-colors"
          >
            Back to Storefront
          </Link>
        </div>
      </div>
    );
  }

  // Render error screen for network/server failures
  if (authStatus === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100 font-sans">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-3xl mb-6 shadow-xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Authorization Error</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-md">{errorMessage}</p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white text-sm transition-colors"
          >
            Retry Verification
          </button>
        </div>
      </div>
    );
  }

  // Render Admin Console Dashboard Shell once authenticated & authorized
  return (
    <div className="admin-scope flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
