'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminProductById,
  updateAdminProduct,
  fetchAdminCategories,
  createAdminVariant,
  createAdminProductImage,
  uploadAdminProductImage,
  deleteAdminProductImage,
} from '@/lib/api/admin';

export default function AdminEditProductPage() {
  const { id } = useParams() as { id: string };
  const { token } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Product Image fields
  const [imageUrl, setImageUrl] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [imageSortOrder, setImageSortOrder] = useState('');
  const [addingImage, setAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  const loadData = () => {
    if (!token || !id) return;
    setLoading(true);
    Promise.all([fetchAdminProductById(token, id), fetchAdminCategories(token)])
      .then(([prodRes, catRes]) => {
        setProduct(prodRes);
        setCategories(catRes);
        setName(prodRes.name || '');
        setPrice(prodRes.price?.toString() || '');
        setDescription(prodRes.description || '');
        setCategoryId(prodRes.categoryId || '');
        setIsActive(prodRes.isActive ?? true);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [token, id]);

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setSaving(true);
    try {
      await updateAdminProduct(token, id, {
        name,
        price: Number(price),
        description,
        categoryId: categoryId || undefined,
        isActive,
      });
      alert('Product updated successfully!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setAddingVariant(true);
    try {
      await createAdminVariant(token, id, {
        name: varName,
        sku: varSku,
        price: Number(varPrice),
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

  const isValidUrl = (url: string) => {
    if (url.startsWith('/')) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    setImageError(null);
    setUploadSuccess(null);

    const trimmedUrl = imageUrl.trim();
    if (!isValidUrl(trimmedUrl)) {
      setImageError('Please enter a valid HTTP/HTTPS URL or local path starting with "/" (e.g. /images/product.jpg)');
      return;
    }

    setAddingImage(true);
    try {
      await createAdminProductImage(token, id, {
        url: trimmedUrl,
        altText: imageAltText.trim() || undefined,
        sortOrder: imageSortOrder ? Number(imageSortOrder) : undefined,
      });
      setImageUrl('');
      setImageAltText('');
      setImageSortOrder('');
      setUploadSuccess('Image URL added successfully!');
      loadData();
    } catch (err: any) {
      setImageError(err.message || 'Failed to add image');
    } finally {
      setAddingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError(null);
    setUploadSuccess(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Invalid file type. Only JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size exceeds the 5MB limit.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id || !selectedFile) return;

    setUploadingFile(true);
    setImageError(null);
    setUploadSuccess(null);

    try {
      await uploadAdminProductImage(token, id, selectedFile, imageAltText || product?.name);
      setUploadSuccess('Image file uploaded successfully to local storage!');
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageAltText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadData();
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!token || !id || !confirm('Are you sure you want to remove this image?')) return;
    setDeletingImageId(imageId);
    setImageError(null);
    setUploadSuccess(null);
    try {
      await deleteAdminProductImage(token, id, imageId);
      setUploadSuccess('Image removed successfully.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image');
    } finally {
      setDeletingImageId(null);
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
        <button
          onClick={() => router.back()}
          className="text-xs text-indigo-400 hover:underline mb-2 inline-block font-semibold"
        >
          ← Back to Products
        </button>
        <h1 className="text-2xl font-black text-white">Edit Product</h1>
        <p className="text-sm text-slate-400">Manage catalog information, images, and variant inventory.</p>
      </div>

      {/* Main Details Form */}
      <form onSubmit={handleUpdateProduct} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Product Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Product Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Base Price (₹)</label>
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

          <div className="flex items-center gap-3 pt-6">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-bold text-slate-300 uppercase">Product Active</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">Description</label>
          <textarea
            rows={4}
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

      {/* Product Images Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Product Images</h2>
            <p className="text-xs text-slate-400 mt-0.5">Upload image files from your computer or enter an external image URL.</p>
          </div>
          <span className="text-xs text-slate-500">{product?.images?.length || 0} images</span>
        </div>

        {imageError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-2">
            <span>⚠️</span>
            <span>{imageError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <span>✅</span>
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* Existing Images */}
        {product?.images && product.images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.images.map((img: any) => (
              <div
                key={img.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <div className="w-16 h-16 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0 border border-slate-800">
                  <img
                    src={img.url}
                    alt={img.altText || product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-slate-300 truncate" title={img.url}>
                    {img.url}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Alt: {img.altText || 'None'} • Order: {img.sortOrder ?? 0}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={deletingImageId === img.id}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {deletingImageId === img.id ? 'Deleting...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No images uploaded for this product yet.</p>
        )}

        {/* Local Computer File Upload Form */}
        <div className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2">
            <span>📁</span> Upload Image from Computer
          </h3>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl bg-slate-950/40 hover:bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <span className="text-2xl">📸</span>
              <span className="text-xs font-bold">Choose Image File (JPG, PNG, WEBP — Max 5MB)</span>
              <span className="text-[11px] text-slate-500">Click to browse files from your computer</span>
            </button>
          ) : (
            <form onSubmit={handleFileUpload} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center gap-4">
                {previewUrl && (
                  <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex-shrink-0">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Alt Text (Optional)"
                  value={imageAltText}
                  onChange={(e) => setImageAltText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  {uploadingFile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading File...</span>
                    </>
                  ) : (
                    <span>Upload Image File →</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* External Image URL Form */}
        <form onSubmit={handleAddImage} className="pt-4 border-t border-slate-800/60 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Or Add External Image URL</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Image URL (e.g. https://... or /images/item.jpg)"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Alt Text (Optional)"
              value={imageAltText}
              onChange={(e) => setImageAltText(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="w-32">
              <input
                type="number"
                placeholder="Sort Order"
                value={imageSortOrder}
                onChange={(e) => setImageSortOrder(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={addingImage}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-slate-200 transition-all"
            >
              {addingImage ? 'Adding URL...' : '+ Add Image URL'}
            </button>
          </div>
        </form>
      </div>

      {/* Variants Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Product Variants</h2>
          <span className="text-xs text-slate-500">{product?.variants?.length || 0} variants</span>
        </div>

        {/* Existing Variants */}
        {product?.variants && product.variants.length > 0 ? (
          <div className="space-y-3">
            {product.variants.map((variant: any) => (
              <div
                key={variant.id}
                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <div>
                  <p className="text-xs font-bold text-white">{variant.name}</p>
                  <p className="text-[11px] font-mono text-slate-400">SKU: {variant.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-indigo-400">₹{Number(variant.price).toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-slate-400">
                    Stock: {variant.inventory?.quantity ?? 0}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No variants created for this product yet.</p>
        )}

        {/* Add Variant Form */}
        <form onSubmit={handleAddVariant} className="pt-4 border-t border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase">Add New Variant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Variant Name (e.g. Size M)"
              required
              value={varName}
              onChange={(e) => setVarName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="SKU (e.g. HOODIE-M-BLK)"
              required
              value={varSku}
              onChange={(e) => setVarSku(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Price (₹)"
              required
              value={varPrice}
              onChange={(e) => setVarPrice(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addingVariant}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/30"
            >
              {addingVariant ? 'Adding...' : '+ Add Variant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
