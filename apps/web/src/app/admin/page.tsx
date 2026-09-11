'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminDashboard } from '@/lib/api/admin';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminDashboard(token)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <p className="font-bold">Error loading dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">{data?.storeName || 'Store'} Overview</h1>
        <p className="text-sm text-slate-400">Tenant-scoped operational metrics & analytics.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${(data?.totalRevenue || 0).toLocaleString('en-IN')}`}
          subtitle="From paid orders"
          icon="💰"
          highlight
        />
        <StatCard
          title="Total Orders"
          value={data?.totalOrders || 0}
          subtitle={`${data?.paidOrders || 0} Paid • ${data?.pendingOrders || 0} Pending`}
          icon="🧾"
        />
        <StatCard
          title="Total Products"
          value={data?.totalProducts || 0}
          subtitle={`${data?.activeProducts || 0} Active`}
          icon="🛍️"
        />
        <StatCard
          title="Low Stock Alert"
          value={data?.lowStockVariants || 0}
          subtitle="Variants at or below threshold"
          icon="⚠️"
        />
      </div>

      {/* Order Status Summary */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
          Order Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs font-medium text-amber-400">PENDING</span>
            <p className="text-xl font-black text-white mt-1">{data?.pendingOrders || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs font-medium text-blue-400">PROCESSING</span>
            <p className="text-xl font-black text-white mt-1">{data?.processingOrders || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs font-medium text-purple-400">SHIPPED</span>
            <p className="text-xl font-black text-white mt-1">{data?.shippedOrders || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs font-medium text-emerald-400">DELIVERED</span>
            <p className="text-xl font-black text-white mt-1">{data?.deliveredOrders || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-xs font-medium text-rose-400">CANCELLED</span>
            <p className="text-xl font-black text-white mt-1">{data?.cancelledOrders || 0}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders & Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs font-bold text-indigo-400 hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {data?.recentOrders?.length ? (
              data.recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{order.orderNumber}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-400">₹{Number(order.total).toLocaleString('en-IN')}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No orders recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Recent Customers</h2>
            <Link href="/admin/customers" className="text-xs font-bold text-indigo-400 hover:underline">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {data?.recentCustomers?.length ? (
              data.recentCustomers.map((cust: any) => (
                <div
                  key={cust.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80"
                >
                  <div>
                    <p className="text-xs font-bold text-white">
                      {cust.firstName ? `${cust.firstName} ${cust.lastName || ''}` : 'Customer'}
                    </p>
                    <p className="text-[10px] text-slate-400">{cust.email || cust.id}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">
                      Joined {new Date(cust.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No registered customers yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
