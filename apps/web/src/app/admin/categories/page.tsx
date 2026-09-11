'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
} from '@/lib/api/admin';

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCategories = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminCategories(token)
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name) return;
    setSubmitting(true);
    try {
      await createAdminCategory(token, { name, description, imageUrl });
      setName('');
      setDescription('');
      setImageUrl('');
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    if (!token || !confirm(`Delete or deactivate category "${catName}"?`)) return;
    try {
      await deleteAdminCategory(token, id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white">Categories</h1>
        <p className="text-sm text-slate-400">Manage store categories and groupings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Category List */}
        <div className="md:col-span-2 rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">All Categories</h2>

          {loading ? (
            <p className="text-xs text-slate-400">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-xs text-slate-500">No categories created yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {categories.map((cat) => (
                <div key={cat.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{cat.name}</p>
                    <p className="text-xs text-slate-400">{cat.slug} • {cat._count?.products || 0} products</p>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="text-xs font-bold text-rose-400 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Category Form */}
        <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 self-start">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Add Category</h2>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Outerwear"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
          >
            {submitting ? 'Saving...' : 'Save Category'}
          </button>
        </form>
      </div>
    </div>
  );
}
