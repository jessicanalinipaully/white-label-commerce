'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  fetchAdminHomepage,
  updateAdminHomepage,
  fetchAdminHomepageSections,
  createAdminHomepageSection,
  updateAdminHomepageSection,
  deleteAdminHomepageSection,
  reorderAdminHomepageSections,
} from '../../../lib/api/admin';

type SectionType = 'HERO' | 'FEATURED_PRODUCTS' | 'FEATURED_CATEGORIES' | 'PROMO_BANNER' | 'TEXT' | 'IMAGE' | 'CTA';

interface Section {
  id: string;
  type: SectionType;
  title: string | null;
  subtitle: string | null;
  imageUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  content: string | null;
  config: any;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminHomepageCMSPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Metadata state
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [pageTitle, setPageTitle] = useState('');

  // Sections state
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // New/Edit Section form state
  const [formType, setFormType] = useState<SectionType>('HERO');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formButtonText, setFormButtonText] = useState('');
  const [formButtonLink, setFormButtonLink] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formLimit, setFormLimit] = useState(8);
  const [formProductIds, setFormProductIds] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [savingSection, setSavingSection] = useState(false);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [hpData, secData] = await Promise.all([
        fetchAdminHomepage(token),
        fetchAdminHomepageSections(token),
      ]);
      if (hpData) {
        setPageTitle(hpData.title || '');
        setMetaTitle(hpData.metaTitle || '');
        setMetaDescription(hpData.metaDescription || '');
      }
      if (Array.isArray(secData)) {
        setSections(secData);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load homepage CMS settings' });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingMeta(true);
    setMessage(null);
    try {
      await updateAdminHomepage(token, {
        title: pageTitle || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
      });
      setMessage({ type: 'success', text: 'Homepage metadata updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update metadata' });
    } finally {
      setSavingMeta(false);
    }
  };

  const openCreateModal = () => {
    setEditingSection(null);
    setFormType('HERO');
    setFormTitle('');
    setFormSubtitle('');
    setFormImageUrl('');
    setFormButtonText('');
    setFormButtonLink('');
    setFormContent('');
    setFormLimit(8);
    setFormProductIds('');
    setFormCategoryIds('');
    setFormIsActive(true);
    setIsCreating(true);
  };

  const openEditModal = (sec: Section) => {
    setEditingSection(sec);
    setFormType(sec.type);
    setFormTitle(sec.title || '');
    setFormSubtitle(sec.subtitle || '');
    setFormImageUrl(sec.imageUrl || '');
    setFormButtonText(sec.buttonText || '');
    setFormButtonLink(sec.buttonLink || '');
    setFormContent(sec.content || '');
    setFormLimit(sec.config?.limit || 8);
    setFormProductIds(Array.isArray(sec.config?.productIds) ? sec.config.productIds.join(', ') : '');
    setFormCategoryIds(Array.isArray(sec.config?.categoryIds) ? sec.config.categoryIds.join(', ') : '');
    setFormIsActive(sec.isActive);
    setIsCreating(true);
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingSection(true);
    setMessage(null);

    const config: any = {};
    if (formType === 'FEATURED_PRODUCTS' || formType === 'FEATURED_CATEGORIES') {
      config.limit = Number(formLimit) || 8;
    }
    if (formProductIds.trim()) {
      config.productIds = formProductIds.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (formCategoryIds.trim()) {
      config.categoryIds = formCategoryIds.split(',').map((s) => s.trim()).filter(Boolean);
    }

    const payload = {
      type: formType,
      title: formTitle || undefined,
      subtitle: formSubtitle || undefined,
      imageUrl: formImageUrl || undefined,
      buttonText: formButtonText || undefined,
      buttonLink: formButtonLink || undefined,
      content: formContent || undefined,
      config: Object.keys(config).length > 0 ? config : undefined,
      isActive: formIsActive,
    };

    try {
      if (editingSection) {
        await updateAdminHomepageSection(token, editingSection.id, payload);
        setMessage({ type: 'success', text: 'Section updated successfully!' });
      } else {
        await createAdminHomepageSection(token, payload);
        setMessage({ type: 'success', text: 'Section created successfully!' });
      }
      setIsCreating(false);
      setEditingSection(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save section' });
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this homepage section?')) return;
    try {
      await deleteAdminHomepageSection(token, id);
      setMessage({ type: 'success', text: 'Section deleted' });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete section' });
    }
  };

  const handleToggleActive = async (sec: Section) => {
    if (!token) return;
    try {
      await updateAdminHomepageSection(token, sec.id, { isActive: !sec.isActive });
      await loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update status' });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (!token) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);
    setSections(newSections);

    try {
      await reorderAdminHomepageSections(
        token,
        newSections.map((s) => s.id)
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reorder sections' });
      await loadData();
    }
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading Homepage CMS...</div>;
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Homepage CMS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize your store&apos;s homepage layout, metadata, and dynamic content sections.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Metadata Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Homepage SEO & Metadata</h2>
        <form onSubmit={handleSaveMeta} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="e.g. Home - Luxury Fashion Store"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title (SEO)</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Trendy Clothing & Fashion | Luxury Store"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description (SEO)</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="e.g. Discover high quality apparel, footwear, and accessories."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="pt-2">
            <button
              type="submit"
              disabled={savingMeta}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 disabled:opacity-50"
            >
              {savingMeta ? 'Saving Metadata...' : 'Save Metadata'}
            </button>
          </div>
        </form>
      </div>

      {/* Sections Manager */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Homepage Sections</h2>
            <p className="text-xs text-gray-500 mt-1">Reorder, enable, or edit content sections on your homepage.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            + Add Section
          </button>
        </div>

        {sections.length === 0 ? (
          <div className="text-center py-12 text-gray-500 border border-dashed rounded-lg">
            No dynamic sections configured yet. Click &quot;+ Add Section&quot; to create your first hero or product grid!
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((sec, index) => (
              <div
                key={sec.id}
                className={`flex items-center justify-between border rounded-lg p-4 transition ${
                  sec.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Move Controls */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 text-xs"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800">
                        {sec.type}
                      </span>
                      <h3 className="font-medium text-gray-900 text-sm">{sec.title || '(Untitled Section)'}</h3>
                    </div>
                    {sec.subtitle && <p className="text-xs text-gray-500 mt-0.5">{sec.subtitle}</p>}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleToggleActive(sec)}
                    className={`px-2.5 py-1 text-xs rounded font-medium border ${
                      sec.isActive
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-100 border-gray-300 text-gray-600'
                    }`}
                  >
                    {sec.isActive ? 'Active' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => openEditModal(sec)}
                    className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 text-xs font-medium rounded hover:bg-gray-200"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDeleteSection(sec.id)}
                    className="px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal / Form drawer for Section Create/Edit */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900">
              {editingSection ? 'Edit Section' : 'Create New Section'}
            </h2>

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as SectionType)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="HERO">Hero Banner (HERO)</option>
                  <option value="FEATURED_PRODUCTS">Featured Products (FEATURED_PRODUCTS)</option>
                  <option value="FEATURED_CATEGORIES">Featured Categories (FEATURED_CATEGORIES)</option>
                  <option value="PROMO_BANNER">Promo Banner (PROMO_BANNER)</option>
                  <option value="TEXT">Rich Text / Notice (TEXT)</option>
                  <option value="IMAGE">Image Block (IMAGE)</option>
                  <option value="CTA">Call to Action (CTA)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. New Summer Collection"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="e.g. Discover our latest arrivals with up to 30% off"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {(formType === 'HERO' || formType === 'PROMO_BANNER' || formType === 'IMAGE' || formType === 'CTA') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Must start with http://, https://, or /</p>
                </div>
              )}

              {(formType === 'HERO' || formType === 'PROMO_BANNER' || formType === 'CTA') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={formButtonText}
                      onChange={(e) => setFormButtonText(e.target.value)}
                      placeholder="e.g. Shop Now"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      value={formButtonLink}
                      onChange={(e) => setFormButtonLink(e.target.value)}
                      placeholder="e.g. /products"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {(formType === 'TEXT' || formType === 'CTA' || formType === 'HERO') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Content</label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={4}
                    placeholder="Enter main text content..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {(formType === 'FEATURED_PRODUCTS' || formType === 'FEATURED_CATEGORIES') && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Section Configuration</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Max Items to Display (limit)</label>
                    <input
                      type="number"
                      value={formLimit}
                      onChange={(e) => setFormLimit(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                    />
                  </div>

                  {formType === 'FEATURED_PRODUCTS' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Specific Product IDs (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formProductIds}
                        onChange={(e) => setFormProductIds(e.target.value)}
                        placeholder="prod_123, prod_456"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}

                  {formType === 'FEATURED_CATEGORIES' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Specific Category IDs (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formCategoryIds}
                        onChange={(e) => setFormCategoryIds(e.target.value)}
                        placeholder="cat_123, cat_456"
                        className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="formIsActive" className="text-sm font-medium text-gray-700">
                  Section is Active (Visible on Storefront)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSection}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingSection ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
