'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { deleteAdminProduct, fetchAdminProducts } from '@/lib/api/admin';
import Link from 'next/link';

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadProducts = () => {
    if (!token) return;
    setLoading(true);
    fetchAdminProducts(token, { search })
      .then((res) => setProducts(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, [token, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!token || !confirm(`Are you sure you want to deactivate/delete "${name}"?`)) return;
    try {
      await deleteAdminProduct(token, id);
      loadProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Products</h1>
          <p className="text-sm text-slate-400">Manage store catalog, prices, and status.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 self-start"
        >
          <span>+ Add Product</span>
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4">
        <input
          type="text"
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No products found.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-xs border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold">Product</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Price</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                          🛍️
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{product.name}</p>
                        <p className="text-xs text-slate-400">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {product.category?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 font-bold text-indigo-400">
                    ₹{Number(product.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-xs font-bold text-indigo-400 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      className="text-xs font-bold text-rose-400 hover:underline"
                    >
                      Delete
                    </button>
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
