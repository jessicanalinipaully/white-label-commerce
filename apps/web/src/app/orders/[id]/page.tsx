'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { fetchCustomerOrderById, Order } from '@/lib/api/order';
import { RazorpayButton } from '@/components/checkout/RazorpayButton';
import { getClientHost } from '@/lib/tenant';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { token } = useCart();
  const host = getClientHost();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrder = async () => {
    if (token && params.id) {
      const data = await fetchCustomerOrderById(token, params.id, host);
      setOrder(data);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [token, params.id, host]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">Loading order details...</div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="text-5xl">📄</div>
        <h1 className="text-2xl font-bold text-white">Order Not Found</h1>
        <p className="text-sm text-slate-400">This order does not exist or does not belong to your account.</p>
        <Link href="/account" className="inline-block px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-semibold text-white">
          Back to Account
        </Link>
      </div>
    );
  }

  const shipping = order.shippingAddressSnapshot || {};
  const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'CAPTURED';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isPaid ? '✓ Order Confirmed & Paid' : '⏳ Order Placed — Payment Pending'}
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1 font-mono">
              {order.orderNumber}
            </h1>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
              isPaid
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {order.status}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Placed on {new Date(order.createdAt).toLocaleString()} &bull; Payment Status:{' '}
          <span className={`font-semibold ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
            {order.paymentStatus}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Items Ordered</h2>
          <div className="divide-y divide-slate-800">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-100 text-sm">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.variantName} &bull; SKU: {item.sku}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ₹{Number(item.unitPrice).toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-white text-sm">
                  ₹{Number(item.lineTotal).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-200">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="text-slate-200 font-semibold">₹{Number(order.shippingAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Taxes</span>
              <span className="text-slate-300">₹{Number(order.taxAmount).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-bold text-white">
              <span>Total</span>
              <span className="text-primary">₹{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {!isPaid && token && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <p className="text-xs text-amber-400 font-medium">Payment is pending for this order. Click below to pay now.</p>
              <RazorpayButton
                orderId={order.id}
                amount={Number(order.total)}
                currency={order.currency || 'INR'}
                token={token}
                onSuccess={() => {
                  loadOrder();
                }}
                onError={(msg) => setError(msg)}
              />
            </div>
          )}
        </div>

        {/* Shipping Address Snapshot */}
        <div className="md:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Shipping Details</h2>
          <div className="text-sm space-y-1 text-slate-300">
            <p className="font-bold text-white">{shipping.firstName} {shipping.lastName}</p>
            <p>{shipping.addressLine1} {shipping.addressLine2}</p>
            <p>{shipping.city}, {shipping.state} {shipping.postalCode}</p>
            <p>{shipping.country}</p>
            <p className="text-xs text-slate-500 pt-2">📞 {shipping.phone}</p>
          </div>

          {order.notes && (
            <div className="pt-4 border-t border-slate-800 space-y-1">
              <span className="text-xs font-semibold text-slate-400 block">Notes</span>
              <p className="text-xs text-slate-300 italic">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
