'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { CustomerAddress, fetchCustomerAddresses, createCustomerAddress } from '@/lib/api/customer';
import { executeCheckout } from '@/lib/api/order';
import { fetchShippingRates, attachOrderShippingRate, ShippingRate } from '@/lib/api/shipping';
import { RazorpayButton } from '@/components/checkout/RazorpayButton';
import { getClientHost } from '@/lib/tenant';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, token, refresh: refreshCart } = useCart();
  const host = getClientHost();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Quick Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    isDefault: true,
  });

  useEffect(() => {
    fetchShippingRates(host).then((rates) => {
      setShippingRates(rates);
      if (rates.length > 0) setSelectedRateId(rates[0].id);
    });

    if (token) {
      loadAddresses(token);
    }
  }, [token, host]);

  const loadAddresses = async (authToken: string) => {
    const addrs = await fetchCustomerAddresses(authToken, host);
    setAddresses(addrs);
    const def = addrs.find((a) => a.isDefault) || addrs[0];
    if (def) {
      setSelectedAddressId(def.id);
    } else {
      setShowAddressForm(true);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const created = await createCustomerAddress(token, newAddr, host);
      setShowAddressForm(false);
      const updated = await fetchCustomerAddresses(token, host);
      setAddresses(updated);
      setSelectedAddressId(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to add address');
    }
  };

  const selectedRate = shippingRates.find((r) => r.id === selectedRateId);
  const shippingCost = selectedRate ? selectedRate.amount : 0;
  const grandTotal = subtotal + shippingCost;

  const handleCreateOrder = async () => {
    if (!token) {
      router.push('/account');
      return;
    }
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      // 1. Create order
      let order = await executeCheckout(token, { shippingAddressId: selectedAddressId, notes }, host);

      // 2. Attach selected shipping rate if chosen
      if (selectedRateId) {
        order = await attachOrderShippingRate(token, order.id, selectedRateId, host);
      }

      await refreshCart();
      setCreatedOrder(order);
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="text-5xl">🔐</div>
        <h1 className="text-2xl font-bold text-white">Authentication Required</h1>
        <p className="text-sm text-slate-400">Please sign in to your customer account to complete checkout.</p>
        <Link
          href="/account"
          className="inline-block px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover font-bold text-white transition-colors"
        >
          Sign In to Checkout →
        </Link>
      </div>
    );
  }

  if (!createdOrder && cart.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="text-5xl">🛒</div>
        <h1 className="text-2xl font-bold text-white">Your Cart is Empty</h1>
        <p className="text-sm text-slate-400">Add some products to your cart before proceeding to checkout.</p>
        <Link
          href="/products"
          className="inline-block px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover font-bold text-white transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-extrabold text-white">Checkout</h1>
        <p className="text-sm text-slate-400 mt-1">Review your order details, choose shipping & initiate payment.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Shipping Address & Shipping Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Address Selection */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">1. Select Shipping Address</h2>
              {!showAddressForm && !createdOrder && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  + Add New Address
                </button>
              )}
            </div>

            {showAddressForm ? (
              <form onSubmit={handleAddAddress} className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="First Name"
                    required
                    value={newAddr.firstName}
                    onChange={(e) => setNewAddr({ ...newAddr, firstName: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                  <input
                    placeholder="Last Name"
                    required
                    value={newAddr.lastName}
                    onChange={(e) => setNewAddr({ ...newAddr, lastName: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                </div>
                <input
                  placeholder="Phone"
                  required
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                />
                <input
                  placeholder="Address Line 1"
                  required
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    placeholder="City"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                  <input
                    placeholder="State"
                    required
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                  <input
                    placeholder="Pincode"
                    required
                    value={newAddr.postalCode}
                    onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white"
                  >
                    Save & Use Address
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shippingAddress"
                      disabled={Boolean(createdOrder)}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-primary"
                    />
                    <div className="text-sm">
                      <p className="font-bold text-white">{addr.firstName} {addr.lastName}</p>
                      <p className="text-xs text-slate-400">{addr.addressLine1} {addr.addressLine2}</p>
                      <p className="text-xs text-slate-400">{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="text-xs text-slate-400">📞 {addr.phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* 2. Shipping Rate Selection */}
          {shippingRates.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-lg font-bold text-white">2. Shipping Options</h2>
              <div className="space-y-3">
                {shippingRates.map((rate) => (
                  <label
                    key={rate.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedRateId === rate.id
                        ? 'border-primary bg-primary/10'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shippingRate"
                        disabled={Boolean(createdOrder)}
                        checked={selectedRateId === rate.id}
                        onChange={() => setSelectedRateId(rate.id)}
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-bold text-slate-100 text-sm">{rate.name}</p>
                        {rate.estimatedDaysMin && (
                          <p className="text-xs text-slate-400">
                            Estimated delivery: {rate.estimatedDaysMin}–{rate.estimatedDaysMax} business days
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-white">₹{rate.amount.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {!createdOrder && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h2 className="text-lg font-bold text-white">3. Notes / Instructions (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Leave at front door or call upon arrival"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>

        {/* Right Column: Order Summary & Payment */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 sticky top-24">
          <h2 className="text-lg font-bold text-white">
            {createdOrder ? `Order #${createdOrder.orderNumber}` : 'Order Summary'}
          </h2>

          {!createdOrder ? (
            <>
              <div className="space-y-3 divide-y divide-slate-800 max-h-60 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.variantId} className="pt-3 flex justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-200">{item.productName}</p>
                      <p className="text-xs text-slate-500">{item.variantName} × {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-200">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="text-slate-200 font-semibold">₹{shippingCost.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-bold text-white">
                  <span>Total</span>
                  <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 font-bold text-white transition-all shadow-lg shadow-primary/30"
              >
                {submitting ? 'Creating Order...' : 'Confirm Order & Proceed to Pay →'}
              </button>
            </>
          ) : (
            <>
              <div className="space-y-3 text-sm border-b border-slate-800 pb-4">
                <div className="flex justify-between text-slate-400">
                  <span>Order Status</span>
                  <span className="text-amber-400 font-semibold">{createdOrder.status}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Payment Status</span>
                  <span className="text-amber-400 font-semibold">{createdOrder.paymentStatus}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Due</span>
                  <span className="text-emerald-400">₹{Number(createdOrder.total).toFixed(2)}</span>
                </div>
              </div>

              <RazorpayButton
                orderId={createdOrder.id}
                amount={Number(createdOrder.total)}
                currency={createdOrder.currency || 'INR'}
                token={token}
                onSuccess={(orderId) => {
                  router.push(`/orders/${orderId}`);
                }}
                onError={(errMsg) => {
                  setError(errMsg);
                }}
              />
            </>
          )}

          <p className="text-xs text-center text-slate-500">
            🔒 Server-controlled payment authorization via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
