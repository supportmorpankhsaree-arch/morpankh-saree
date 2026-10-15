"use client";

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { Category } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { uploadToR2 } from '@/lib/r2Upload';
import { ImageUploadSelector } from '@/components/ImageUploadSelector';

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', image: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data.map((cat: { _id?: string; id?: string; name: string; slug: string; image: string; productCount: number }) => ({
          ...cat,
          id: cat._id || cat.id
        })));
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({ title: 'Error', description: 'Failed to fetch categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setEditing(null); 
    setForm({ name: '', slug: '', image: '' }); 
    setImageFile(null);
    setUploadProgress(0);
    setModalOpen(true); 
  };
  
  const openEdit = (c: Category) => { 
    setEditing(c); 
    setForm({ name: c.name, slug: c.slug, image: c.image }); 
    setImageFile(null);
    setUploadProgress(0);
    setModalOpen(true); 
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    
    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelected = async (file: File) => {
    handleImageUpload(file);
    setImageSelectorOpen(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);
    
    try {
      let imageUrlToUse = form.image;

      if (imageFile) {
        imageUrlToUse = await uploadToR2(imageFile, {
          folder: 'categories',
          maxBytes: 10 * 1024 * 1024,
          onProgress: (pct) => setUploadProgress(pct),
        });
      }

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('slug', form.slug || form.name.toLowerCase().replace(/\s+/g, '-'));

      if (imageUrlToUse && !imageUrlToUse.startsWith('data:')) {
        formData.append('imageUrl', imageUrlToUse);
      }

      const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories';
      const method = editing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ title: editing ? 'Category updated' : 'Category added' });
        setModalOpen(false);
        fetchCategories(); // Refresh the list
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast({ title: 'Error', description: 'Failed to save category', variant: 'destructive' });
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ title: 'Category deleted' });
        fetchCategories(); // Refresh the list
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2"><Plus className="h-4 w-4" /> Add Category</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl border border-border overflow-hidden card-hover">
            <div className="aspect-video overflow-hidden">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-xs text-muted-foreground">/{cat.slug} · {cat.productCount} products</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(cat)} className="p-2 hover:bg-muted rounded-lg transition-colors"><Pencil className="h-4 w-4 text-primary" /></button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={Boolean(deletingId || submitting)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === cat.id ? (
                    <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold">{editing ? 'Edit' : 'Add'} Category</h2>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Category Image</label>
                <div className="flex items-center gap-3">
                  {form.image && (
                    <img src={form.image} alt="Preview" className="w-16 h-12 object-cover rounded border border-border" />
                  )}
                  <button
                    type="button"
                    onClick={() => setImageSelectorOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    <Upload className="h-4 w-4" /> Upload
                  </button>
                </div>
                <input type="text" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Or paste image URL" className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring mt-2" />
              </div>
              <div><label className="block text-sm font-medium mb-1">Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <div><label className="block text-sm font-medium mb-1">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
              <button onClick={handleSave} disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Update' : 'Add'} Category
              </button>
              {submitting && uploadProgress > 0 && uploadProgress < 100 && (
                <p className="text-xs text-muted-foreground text-center">Uploading: {uploadProgress}%</p>
              )}
            </div>
          </div>
        </div>
      )}

      <ImageUploadSelector
        open={imageSelectorOpen}
        onClose={() => setImageSelectorOpen(false)}
        onFileSelected={handleImageSelected}
        accept="image/*"
      />
    </AdminLayout>
  );
};

export default AdminCategories;
