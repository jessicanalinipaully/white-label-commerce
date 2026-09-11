'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { adjustAdminInventory, fetchAdminInventory } from '@/lib/api/admin';

export default function AdminInventoryPage() {
  const { token } = useAuth();
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Adjustment Modal/State
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [reason, setReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const loadInventory = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminInventory(token, { lowStockOnly })
      .then((res) => setInventoryList(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInventory();
  }, [token, lowStockOnly]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedVariant || !adjustQty) return;
    setAdjusting(true);
    try {
      await adjustAdminInventory(token, selectedVariant.variantId, {
        adjustmentQuantity: Number(adjustQty),
        reason,
      });
      setSelectedVariant(null);
      setAdjustQty('');
      setReason('');
      loadInventory();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust inventory');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Inventory Management</h1>
          <p className="text-sm text-slate-400">Track stock levels and process atomic inventory adjustments.</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-950"
          />
          <span>Show Low Stock Only</span>
        </label>
      </div>

      {/* Inventory Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading inventory data...</div>
        ) : inventoryList.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No inventory items found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Item</th>
                <th className="px-6 py-4 font-bold">SKU</th>
                <th className="px-6 py-4 font-bold">Total Stock</th>
                <th className="px-6 py-4 font-bold">Reserved</th>
                <th className="px-6 py-4 font-bold">Available</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {inventoryList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">
                      {item.variant?.product?.name || 'Product'} - {item.variant?.name || 'Variant'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">{item.variant?.sku}</td>
                  <td className="px-6 py-4 font-bold text-white">{item.quantity}</td>
                  <td className="px-6 py-4 text-slate-400">{item.reservedQuantity}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">{item.availableQuantity}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedVariant(item)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 text-xs font-bold transition-colors"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Adjust Modal */}
      {selectedVariant && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustSubmit}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h2 className="text-base font-bold text-white">
              Adjust Inventory for {selectedVariant.variant?.product?.name} ({selectedVariant.variant?.name})
            </h2>
            <p className="text-xs text-slate-400">Current Quantity: {selectedVariant.quantity}</p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">
                Adjustment Amount (+/-) *
              </label>
              <input
                type="number"
                required
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="e.g. 10 or -5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Restock shipment or damaged goods"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedVariant(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjusting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/20"
              >
                {adjusting ? 'Processing...' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
