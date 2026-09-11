'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminCustomerById } from '@/lib/api/admin';

export default function AdminCustomerDetailPage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    setLoading(true);
    fetchAdminCustomerById(token, id)
      .then(setCustomer)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return <div className="p-8 text-center text-slate-400">Customer not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">
          {customer.firstName ? `${customer.firstName} ${customer.lastName || ''}` : 'Customer Profile'}
        </h1>
        <p className="text-xs text-slate-400">Email: {customer.email}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
          <p className="text-2xl font-black text-white mt-1">{customer.orderCount}</p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Spent (Paid)</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            ₹{Number(customer.totalSpent).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase">Joined</span>
          <p className="text-sm font-bold text-slate-200 mt-2">
            {new Date(customer.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Addresses */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Addresses</h2>
        {customer.addresses?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {customer.addresses.map((addr: any) => (
              <div key={addr.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-white">{addr.firstName} {addr.lastName}</p>
                <p className="text-slate-300">{addr.addressLine1}</p>
                {addr.addressLine2 && <p className="text-slate-400">{addr.addressLine2}</p>}
                <p className="text-slate-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                <p className="text-slate-400">{addr.country} • Phone: {addr.phone}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No addresses on file.</p>
        )}
      </div>

      {/* Order History */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Order History</h2>
        {customer.orders?.length ? (
          <div className="divide-y divide-slate-800">
            {customer.orders.map((ord: any) => (
              <div key={ord.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">{ord.orderNumber}</p>
                  <p className="text-[10px] text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-400">₹{Number(ord.total).toLocaleString('en-IN')}</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No orders placed yet.</p>
        )}
      </div>
    </div>
  );
}
