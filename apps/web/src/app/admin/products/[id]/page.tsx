'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminProductById,
  updateAdminProduct,
  fetchAdminCategories,
  createAdminVariant,
} from '@/lib/api/admin';

export default function AdminEditProductPage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Product fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Variant fields
  const [varName, setVarName] = useState('');
  const [varSku, setVarSku] = useState('');
  const [varPrice, setVarPrice] = useState('');
  const [addingVariant, setAddingVariant] = useState(false);

  const loadData = () => {
    if (!token || !id) return;
    setLoading(true);
    Promise.all([fetchAdminProductById(token, id), fetchAdminCategories(token)])
      .then(([prodRes, catRes]) => {
        setProduct(prodRes);
        setName(prodRes.name);
        setPrice(prodRes.price.toString());
        setDescription(prodRes.description || '');
        setCategoryId(prodRes.categoryId || '');
        setIsActive(prodRes.isActive);
        setCategories(catRes);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [token, id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      await updateAdminProduct(token, id, {
        name,
        price: Number(price),
        description,
        categoryId: categoryId || undefined,
        isActive,
      });
      alert('Product updated successfully');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !varName || !varSku) return;
    setAddingVariant(true);
    try {
      await createAdminVariant(token, id, {
        name: varName,
        sku: varSku,
        price: varPrice ? Number(varPrice) : undefined,
      });
      setVarName('');
      setVarSku('');
      setVarPrice('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add variant');
    } finally {
      setAddingVariant(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Edit Product</h1>
        <p className="text-sm text-slate-400">ID: {product?.id}</p>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleUpdate} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Product Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Price (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select Category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Status</label>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
          >
            {saving ? 'Saving...' : 'Update Product'}
          </button>
        </div>
      </form>

      {/* Variants Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Product Variants</h2>

        {/* Existing Variants */}
        <div className="space-y-3">
          {product?.variants?.map((variant: any) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <div>
                <p className="text-xs font-bold text-white">{variant.name}</p>
                <p className="text-[10px] text-slate-400">SKU: {variant.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-400">
                  {variant.price ? `₹${variant.price}` : 'Default Price'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Stock: {variant.inventory?.quantity ?? 0}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Add Variant Form */}
        <form onSubmit={handleAddVariant} className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Add New Variant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Variant Name (e.g. Size L)"
              required
              value={varName}
              onChange={(e) => setVarName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
            <input
              type="text"
              placeholder="SKU"
              required
              value={varSku}
              onChange={(e) => setVarSku(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price Override (Optional)"
              value={varPrice}
              onChange={(e) => setVarPrice(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            disabled={addingVariant}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
          >
            {addingVariant ? 'Adding...' : '+ Add Variant'}
          </button>
        </form>
      </div>
    </div>
  );
}
