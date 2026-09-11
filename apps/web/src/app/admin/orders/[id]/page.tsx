'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { fetchAdminOrderById, updateAdminOrderStatus } from '@/lib/api/admin';

export default function AdminOrderDetailPage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');

  const loadOrder = () => {
    if (!token || !id) return;
    setLoading(true);
    fetchAdminOrderById(token, id)
      .then((res) => {
        setOrder(res);
        setTargetStatus(res.status);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrder();
  }, [token, id]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !targetStatus) return;
    setUpdating(true);
    try {
      await updateAdminOrderStatus(token, id, targetStatus);
      alert('Order status updated');
      loadOrder();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <div className="p-8 text-center text-slate-400">Order not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{order.orderNumber}</h1>
          <p className="text-xs text-slate-400">Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Payment: {order.paymentStatus}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-white">
            Status: {order.status}
          </span>
        </div>
      </div>

      {/* Status Transition Controls */}
      <form onSubmit={handleStatusUpdate} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-300">Update Order Status</h2>
          <p className="text-xs text-slate-400">Follow valid state transition rules.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <button
            type="submit"
            disabled={updating || targetStatus === order.status}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-colors"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </form>

      {/* Order Items & Totals */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Order Items</h2>
        <div className="divide-y divide-slate-800">
          {order.items?.map((item: any) => (
            <div key={item.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{item.productName}</p>
                <p className="text-xs text-slate-400">Variant: {item.variantName} • Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-bold text-indigo-400">₹{Number(item.lineTotal).toLocaleString('en-IN')}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-2 text-sm text-slate-300">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal</span>
            <span>₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Shipping ({order.shippingProvider || 'Standard'})</span>
            <span>₹{Number(order.shippingAmount).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
            <span>Total</span>
            <span className="text-indigo-400">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
