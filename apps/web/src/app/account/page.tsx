'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import {
  createCustomerAddress,
  CustomerAddress,
  CustomerProfile,
  deleteCustomerAddress,
  fetchCustomerAddresses,
  fetchCustomerProfile,
} from '@/lib/api/customer';
import { fetchCustomerOrders, Order } from '@/lib/api/order';
import { getClientHost } from '@/lib/tenant';
import { AddressFormWithGoogle } from '@/components/address/AddressFormWithGoogle';

export default function AccountPage() {
  const { token, setToken: setCartToken } = useCart();
  const { setToken: setWishlistToken } = useWishlist();

  const handleSetToken = async (newToken: string | null) => {
    await setCartToken(newToken);
    await setWishlistToken(newToken);
  };
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders'>('profile');

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Address Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: false,
  });

  const host = getClientHost();

  useEffect(() => {
    if (token) {
      loadCustomerData(token);
    }
  }, [token]);

  const loadCustomerData = async (authToken: string) => {
    try {
      const [prof, addrs, ords] = await Promise.all([
        fetchCustomerProfile(authToken, host),
        fetchCustomerAddresses(authToken, host),
        fetchCustomerOrders(authToken, 1, 20, host),
      ]);
      setProfile(prof);
      setAddresses(addrs);
      setOrders(ords?.data || []);
    } catch {
      //
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!passwordInput) {
      setAuthError('Password is required.');
      return;
    }

    setAuthLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': host },
        body: JSON.stringify({ email: trimmedEmail, password: passwordInput }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.message || 'Invalid email or password';
        throw new Error(msg);
      }
      const data = await res.json();
      await handleSetToken(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!nameInput.trim()) {
      setAuthError('Full name is required.');
      return;
    }
    const trimmedEmail = emailInput.trim().toLowerCase();
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (passwordInput.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordInput)) {
      setAuthError('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError('Passwords do not match.');
      return;
    }

    setAuthLoading(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': host },
        body: JSON.stringify({
          name: nameInput.trim(),
          email: trimmedEmail,
          password: passwordInput,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = Array.isArray(errorData.message)
          ? errorData.message[0]
          : errorData.message || 'Registration failed';
        throw new Error(msg);
      }

      const data = await res.json();
      await handleSetToken(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await createCustomerAddress(token, addressForm, host);
      setShowAddressModal(false);
      const updatedAddrs = await fetchCustomerAddresses(token, host);
      setAddresses(updatedAddrs);
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!token || !confirm('Delete this address?')) return;
    await deleteCustomerAddress(token, id, host);
    const updatedAddrs = await fetchCustomerAddresses(token, host);
    setAddresses(updatedAddrs);
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-12 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">👤</div>
          <h1 className="text-3xl font-extrabold text-white">
            {authMode === 'signin' ? 'Sign In to Your Account' : 'Create an Account'}
          </h1>
          <p className="text-sm text-slate-400">
            {authMode === 'signin'
              ? 'Manage profile, shipping addresses & order history'
              : 'Join to track orders, save addresses & speed up checkout'}
          </p>
        </div>

        {authMode === 'signin' ? (
          <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="alice@urbanthread.com"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="pt-2 text-center text-sm text-slate-400 border-t border-slate-800">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {authError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Full Name</label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Jane Doe"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="jane@example.com"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
              <p className="text-[11px] text-slate-500">Must be at least 8 characters with 1 uppercase, 1 lowercase & 1 number.</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
              <input
                type="password"
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover font-bold text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {authLoading ? 'Creating account...' : 'Create Account'}
            </button>

            <div className="pt-2 text-center text-sm text-slate-400 border-t border-slate-800">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                }}
                className="text-primary font-semibold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Account Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Customer Account</h1>
          <p className="text-sm text-slate-400 mt-1">
            Signed in as <span className="text-primary font-semibold">{profile?.user?.email || 'Customer'}</span>
          </p>
        </div>

        <button
          onClick={() => handleSetToken(null)}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        {(['profile', 'addresses', 'orders'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-semibold capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-lg space-y-4">
          <h2 className="text-lg font-bold text-white">Profile Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-slate-500 block text-xs">First Name</span>
              <span className="font-semibold text-slate-200">{profile?.firstName || 'Not set'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Last Name</span>
              <span className="font-semibold text-slate-200">{profile?.lastName || 'Not set'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs">Phone</span>
              <span className="font-semibold text-slate-200">{profile?.phone || 'Not set'}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Saved Shipping Addresses</h2>
            <button
              onClick={() => setShowAddressModal(true)}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-sm font-bold text-white transition-colors"
            >
              + Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              No saved addresses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-sm space-y-1">
                  <p className="font-bold text-white">{addr.firstName} {addr.lastName}</p>
                  <p className="text-xs text-slate-400">{addr.addressLine1} {addr.addressLine2}</p>
                  <p className="text-xs text-slate-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                  <p className="text-xs text-slate-400">📞 {addr.phone}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Address Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <h3 className="text-lg font-bold text-white">Add Delivery Address</h3>
                <AddressFormWithGoogle
                  onSave={async (data) => {
                    if (!token) return;
                    await createCustomerAddress(token, data, host);
                    setShowAddressModal(false);
                    const updatedAddrs = await fetchCustomerAddresses(token, host);
                    setAddresses(updatedAddrs);
                  }}
                  onCancel={() => setShowAddressModal(false)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Order History</h2>
          {orders.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              No orders placed yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-sm font-bold text-primary">{ord.orderNumber}</span>
                    <p className="text-xs text-slate-400 mt-1">Placed on {new Date(ord.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-semibold text-slate-300 mt-1">
                      {ord.items?.length || 0} item(s) &bull; Status: <span className="text-amber-400">{ord.status}</span>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold text-white">₹{Number(ord.total).toFixed(2)}</p>
                    <Link
                      href={`/orders/${ord.id}`}
                      className="inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      View Order Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
