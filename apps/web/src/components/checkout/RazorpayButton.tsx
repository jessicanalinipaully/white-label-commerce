'use client';

import { useState } from 'react';
import { createPaymentOrder, verifyPayment } from '@/lib/api/payment';
import { getClientHost } from '@/lib/tenant';

interface RazorpayButtonProps {
  orderId: string;
  amount: number;
  currency: string;
  token: string;
  onSuccess: (orderId: string) => void;
  onError: (msg: string) => void;
}

export function RazorpayButton({
  orderId,
  amount,
  currency,
  token,
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const host = getClientHost();

  const handlePay = async () => {
    setLoading(true);
    try {
      // 1. Create payment order through backend (amount calculated on server)
      const payOrder = await createPaymentOrder(token, orderId, host);

      // Check if Razorpay JS SDK script is loaded or mock mode fallback
      if (typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: payOrder.keyId,
          amount: payOrder.amount * 100,
          currency: payOrder.currency,
          name: 'Store Checkout',
          description: `Payment for Order #${orderId}`,
          order_id: payOrder.providerOrderId,
          handler: async function (response: any) {
            try {
              await verifyPayment(
                token,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
                host,
              );
              onSuccess(orderId);
            } catch (err: any) {
              onError(err.message || 'Payment verification failed');
            }
          },
          prefill: {},
          theme: { color: '#4f46e5' },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        // Fallback for development/testing when Checkout JS is not loaded: simulate verification call
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const mockSig = `test_valid_signature`;

        await verifyPayment(
          token,
          {
            razorpay_order_id: payOrder.providerOrderId,
            razorpay_payment_id: mockPaymentId,
            razorpay_signature: mockSig,
          },
          host,
        );
        onSuccess(orderId);
      }
    } catch (err: any) {
      onError(err.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-white transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
    >
      <span>{loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)} Now`}</span>
      <span>💳</span>
    </button>
  );
}
