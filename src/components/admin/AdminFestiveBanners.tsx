"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Loader2, Sparkles, ExternalLink, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/hooks/use-toast';
import { uploadToR2 } from '@/lib/r2Upload';
import { ImageUploadSelector } from '@/components/ImageUploadSelector';
import Image from 'next/image';

export interface FestiveBannerItem {
  id: string;
  title: string;
  price: string;
  subtitle?: string;
  tagText?: string;
  bankOfferText?: string;
  badgeTitle?: string;
  badgeSub?: string;
  link: string;
  image: string;
  gradient?: string;
  order?: number;
  isActive: boolean;
  createdAt?: string;
}

const GRADIENT_PRESETS = [
  { label: 'Royal Purple / Gold', value: 'from-[#2b0845] via-[#4e1078] to-[#7919a3]' },
  { label: 'Deep Ruby / Maroon', value: 'from-[#3b0826] via-[#631241] to-[#8d1d5d]' },
  { label: 'Emerald Handloom', value: 'from-[#032927] via-[#094d47] to-[#0e746a]' },
  { label: 'Festive Indigo / Sapphire', value: 'from-[#112348] via-[#1c3d78] to-[#295aa6]' },
  { label: 'Vibrant Magenta / Violet', value: 'from-[#1a0e38] via-[#3a1b75] to-[#6026b0]' },
];

export default function AdminFestiveBanners() {
  const [banners, setBanners] = useState<FestiveBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FestiveBannerItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    price: '',
    subtitle: '',
    tagText: '',
    bankOfferText: '10% Instant Discount*',
    badgeTitle: 'THE BIG',
    badgeSub: 'FESTIVE DAYS',
    link: '/products',
    image: '',
    gradient: GRADIENT_PRESETS[0].value,
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/festive-banners', {
        headers: { Authorization: 'Bearer admin-token' },
      });
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setBanners(result.data);
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to fetch festive banners', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching festive banners:', error);
      toast({ title: 'Error', description: 'Failed to fetch festive banners', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({
      title: '',
      price: 'Starts ₹2,999*',
      subtitle: 'Exclusive Festive Handcraft',
      tagText: 'Pure Authentic Silk',
      bankOfferText: '10% Instant Savings* on Cards',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      link: '/products',
      image: '',
      gradient: GRADIENT_PRESETS[0].value,
      order: banners.length + 1,
      isActive: true,
    });
    setImageFile(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const openEdit = (b: FestiveBannerItem) => {
    setEditing(b);
    setForm({
      title: b.title,
      price: b.price || '',
      subtitle: b.subtitle || '',
      tagText: b.tagText || '',
      bankOfferText: b.bankOfferText || '10% Instant Discount*',
      badgeTitle: b.badgeTitle || 'THE BIG',
      badgeSub: b.badgeSub || 'FESTIVE DAYS',
      link: b.link || '/products',
      image: b.image || '',
      gradient: b.gradient || GRADIENT_PRESETS[0].value,
      order: b.order || 0,
      isActive: b.isActive,
    });
    setImageFile(null);
    setUploadProgress(0);
    setModalOpen(true);
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: 'Required', description: 'Please enter a title for the card', variant: 'destructive' });
      return;
    }
    if (!form.image && !imageFile) {
      toast({ title: 'Required', description: 'Please upload or provide an image for the card', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let finalImageUrl = form.image;

      if (imageFile) {
        finalImageUrl = await uploadToR2(imageFile, {
          folder: 'festive-banners',
          maxBytes: 10 * 1024 * 1024,
          onProgress: (pct) => setUploadProgress(pct),
        });
      }

      const payload = {
        ...form,
        image: finalImageUrl,
      };

      const url = '/api/admin/festive-banners';
      const method = editing ? 'PUT' : 'POST';
      const body = editing ? JSON.stringify({ id: editing.id, ...payload }) : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body,
      });

      const json = await res.json();
      if (json.success) {
        toast({ title: 'Success', description: editing ? 'Festive Card updated' : 'Festive Card created' });
        setModalOpen(false);
        fetchBanners();
      } else {
        toast({ title: 'Error', description: json.error || 'Failed to save', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error saving festive banner:', err);
      toast({ title: 'Error', description: 'Failed to save festive banner', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this festive card?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/festive-banners?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer admin-token' },
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: 'Success', description: 'Banner deleted successfully' });
        setBanners((prev) => prev.filter((b) => b.id !== id));
      } else {
        toast({ title: 'Error', description: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete banner', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (b: FestiveBannerItem) => {
    try {
      const res = await fetch('/api/admin/festive-banners', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({ id: b.id, isActive: !b.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        setBanners((prev) => prev.map((item) => (item.id === b.id ? { ...item, isActive: !item.isActive } : item)));
        toast({ title: !b.isActive ? 'Banner Activated' : 'Banner Deactivated' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle status', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-500" />
              Festive Category Specials Banners
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the Flipkart Big Billion Days style banner cards shown in the Festive Category Specials carousel on the homepage.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Festive Card
          </button>
        </div>

        {/* Banner List / Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" /> Loading festive cards...
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/50">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="font-semibold text-lg text-foreground">No custom festive cards yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              Add your first festive card to feature special saree collections with customized price offers, bank discounts, and eye-catching artwork.
            </p>
            <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2 text-sm">
              <Plus className="h-4 w-4" /> Create First Card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((b, idx) => (
              <div
                key={`banner-${b.id || idx}-${idx}`}
                className={`rounded-2xl border ${
                  b.isActive ? 'border-border shadow-sm' : 'border-dashed border-muted-foreground/30 opacity-70'
                } bg-card overflow-hidden flex flex-col justify-between transition-all`}
              >
                {/* Visual Card Preview */}
                <div className={`p-4 relative bg-gradient-to-r ${b.gradient || GRADIENT_PRESETS[0].value} text-white min-h-[170px] flex items-center justify-between overflow-hidden`}>
                  {/* Garland decoration */}
                  <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-yellow-300/20 to-transparent pointer-events-none" />
                  
                  {/* Left Content Preview */}
                  <div className="relative z-10 max-w-[62%] space-y-1">
                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[8px] uppercase tracking-wider">
                      {b.badgeTitle || 'THE BIG'} {b.badgeSub || 'FESTIVE DAYS'}
                    </span>
                    <h4 className="font-bold text-base text-white truncate drop-shadow-sm">{b.title}</h4>
                    <p className="text-yellow-300 font-extrabold text-sm drop-shadow-sm">{b.price}</p>
                    {b.subtitle && <p className="text-[11px] text-white/80 truncate">{b.subtitle}</p>}
                    {b.bankOfferText && (
                      <span className="inline-block mt-1 text-[9px] bg-white/20 backdrop-blur-xs px-1.5 py-0.5 rounded text-white font-medium truncate max-w-full">
                        💳 {b.bankOfferText}
                      </span>
                    )}
                  </div>

                  {/* Right Image Pedestal Preview */}
                  <div className="relative z-10 w-24 h-32 rounded-xl overflow-hidden border-2 border-amber-300/80 shadow-lg bg-black/20 shrink-0">
                    {b.image ? (
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white/50">No Image</div>
                    )}
                    {b.tagText && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-amber-300 text-[8px] font-bold text-center py-0.5 truncate px-0.5">
                        {b.tagText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Info & Actions Footer */}
                <div className="p-3.5 bg-card flex items-center justify-between gap-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(b)}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium transition-colors ${
                        b.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      title={b.isActive ? 'Click to hide' : 'Click to show'}
                    >
                      {b.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      {b.isActive ? 'Active' : 'Hidden'}
                    </button>
                    {b.link && (
                      <a href={b.link} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit Card"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      disabled={deletingId === b.id}
                      className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete Card"
                    >
                      {deletingId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-card text-card-foreground border border-border rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-8">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-amber-500" />
                {editing ? 'Edit Festive Banner Card' : 'Add New Festive Banner Card'}
              </h2>

              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                {/* Title & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Headline / Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Royal Silk Sarees"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Price Tag / Offer Headline
                    </label>
                    <input
                      type="text"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="e.g. Starts ₹3,499* or Min 40% Off"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                </div>

                {/* Subtitle & Pedestal Tag */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Subtitle / Material Highlight
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      placeholder="e.g. Pure Banarasi & Kanjivaram"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Pedestal Tag Badge
                    </label>
                    <input
                      type="text"
                      value={form.tagText}
                      onChange={(e) => setForm({ ...form, tagText: e.target.value })}
                      placeholder="e.g. Pure Gold Zari or Authentic Handloom"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                </div>

                {/* Bank Offer & Destination Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Bank Offer Pill Text
                    </label>
                    <input
                      type="text"
                      value={form.bankOfferText}
                      onChange={(e) => setForm({ ...form, bankOfferText: e.target.value })}
                      placeholder="e.g. 10% Instant Discount*"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Destination Link
                    </label>
                    <input
                      type="text"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      placeholder="e.g. /products?category=silk"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                </div>

                {/* Starburst Badges Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Circular Badge Line 1
                    </label>
                    <input
                      type="text"
                      value={form.badgeTitle}
                      onChange={(e) => setForm({ ...form, badgeTitle: e.target.value })}
                      placeholder="e.g. THE BIG"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Circular Badge Line 2
                    </label>
                    <input
                      type="text"
                      value={form.badgeSub}
                      onChange={(e) => setForm({ ...form, badgeSub: e.target.value })}
                      placeholder="e.g. FESTIVE DAYS"
                      className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background"
                    />
                  </div>
                </div>

                {/* Gradient Preset */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Background Color Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setForm({ ...form, gradient: preset.value })}
                        className={`p-2 rounded-lg border text-left text-xs font-medium flex items-center gap-2 transition-all ${
                          form.gradient === preset.value
                            ? 'border-primary ring-2 ring-primary/30 shadow-xs'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-gradient-to-r ${preset.value} shrink-0 shadow-xs`} />
                        <span className="truncate">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Upload / URL */}
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">
                    Card Model / Saree Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-border rounded-xl bg-muted/20">
                    <div className="w-24 h-32 rounded-lg border border-border overflow-hidden bg-black/10 shrink-0 relative flex items-center justify-center">
                      {form.image ? (
                        <img src={form.image} alt="Preview" className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground text-center px-1">No Image Selected</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex flex-wrap gap-2">
                        <label className="btn-outline-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium cursor-pointer rounded-lg">
                          <Upload className="h-3.5 w-3.5" /> Upload File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageUpload(f);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setImageSelectorOpen(true)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-input hover:bg-muted transition-colors"
                        >
                          Camera / Gallery
                        </button>
                      </div>
                      <input
                        type="text"
                        value={form.image}
                        onChange={(e) => setForm({ ...form, image: e.target.value })}
                        placeholder="Or paste external image URL..."
                        className="w-full px-3 py-1.5 text-xs border border-input rounded-lg bg-background"
                      />
                      {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Display Order & Active */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-foreground">Display Order:</label>
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 0 })}
                      className="w-20 px-2.5 py-1 text-xs border border-input rounded-lg bg-background"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    Display on Homepage
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? 'Update Card' : 'Save & Publish Card'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Media Selector Helper */}
        <ImageUploadSelector
          open={imageSelectorOpen}
          onClose={() => setImageSelectorOpen(false)}
          onFileSelected={(file) => {
            handleImageUpload(file);
            setImageSelectorOpen(false);
          }}
        />
      </div>
    </AdminLayout>
  );
}
