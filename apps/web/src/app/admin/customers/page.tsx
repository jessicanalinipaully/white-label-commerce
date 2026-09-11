'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminCustomers } from '@/lib/api/admin';
import Link from 'next/link';

export default function AdminCustomersPage() {
  const { token } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminCustomers(token, { search })
      .then((res) => setCustomers(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Customers</h1>
        <p className="text-sm text-slate-400">View tenant customer accounts, order history, and total spending.</p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <input
          type="text"
          placeholder="Search customers by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No customers found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Customer</th>
                <th className="px-6 py-4 font-bold">Orders</th>
                <th className="px-6 py-4 font-bold">Total Spent</th>
                <th className="px-6 py-4 font-bold">Joined</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">
                      {customer.firstName ? `${customer.firstName} ${customer.lastName || ''}` : 'Customer'}
                    </p>
                    <p className="text-xs text-slate-400">{customer.email || 'No email'}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200">{customer.orderCount}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">
                    ₹{Number(customer.totalSpent).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-xs font-bold text-indigo-400 hover:underline"
                    >
                      View Profile →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
