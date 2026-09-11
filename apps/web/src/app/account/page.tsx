'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
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

export default function AccountPage() {
  const { token, setToken } = useCart();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
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
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': host },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });
      if (!res.ok) {
        throw new Error('Invalid email or password');
      }
      const data = await res.json();
      await setToken(data.accessToken);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed');
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
          <h1 className="text-3xl font-extrabold text-white">Sign In to Your Account</h1>
          <p className="text-sm text-slate-400">Manage profile, shipping addresses & order history</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
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
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-colors"
          >
            Sign In
          </button>
        </form>
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
            Signed in as <span className="text-indigo-400 font-semibold">{profile?.user?.email || 'Customer'}</span>
          </p>
        </div>

        <button
          onClick={() => setToken(null)}
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
                ? 'border-indigo-500 text-indigo-400'
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-colors"
            >
              + Add Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              No saved addresses yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 relative">
                  {addr.isDefault && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Default
                    </span>
                  )}
                  <p className="font-bold text-slate-100">{addr.firstName} {addr.lastName}</p>
                  <p className="text-xs text-slate-400">{addr.addressLine1} {addr.addressLine2}</p>
                  <p className="text-xs text-slate-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                  <p className="text-xs text-slate-400">{addr.country} &bull; 📞 {addr.phone}</p>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Address Modal */}
          {showAddressModal && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <form
                onSubmit={handleCreateAddress}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4"
              >
                <h3 className="text-lg font-bold text-white">Add Shipping Address</h3>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="First Name"
                    required
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                  <input
                    placeholder="Last Name"
                    required
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                </div>

                <input
                  placeholder="Phone Number"
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                />

                <input
                  placeholder="Address Line 1"
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                />

                <input
                  placeholder="Address Line 2 (Optional)"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                />

                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="City"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                  <input
                    placeholder="State"
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                  <input
                    placeholder="Pincode"
                    required
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  />
                  Set as default address
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-sm font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold text-white"
                  >
                    Save Address
                  </button>
                </div>
              </form>
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
                    <span className="font-mono text-sm font-bold text-indigo-400">{ord.orderNumber}</span>
                    <p className="text-xs text-slate-400 mt-1">Placed on {new Date(ord.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-semibold text-slate-300 mt-1">
                      {ord.items?.length || 0} item(s) &bull; Status: <span className="text-amber-400">{ord.status}</span>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-lg font-bold text-white">₹{Number(ord.total).toFixed(2)}</p>
                    <Link
                      href={`/orders/${ord.id}`}
                      className="inline-block text-xs font-semibold text-indigo-400 hover:underline"
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
