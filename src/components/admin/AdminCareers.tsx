"use client";

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Loader2, Search } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { ImageUploadSelector } from '@/components/ImageUploadSelector';

interface Career {
  _id?: string;
  title: string;
  excerpt: string;
  description: string;
  image: string;
  status: 'open' | 'closed';
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

type CareerForm = {
  title: string;
  excerpt: string;
  description: string;
  image: string;
  status: 'open' | 'closed';
};

const AdminCareers = () => {
  const { isAdmin } = useStore();
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  const [formData, setFormData] = useState<CareerForm>({
    title: '',
    excerpt: '',
    description: '',
    image: '',
    status: 'open',
  });

  const getAuthHeader = () => {
    return { Authorization: `Bearer admin-token` };
  };

  const fetchCareers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/admin/careers?${params}`, {
        headers: getAuthHeader(),
      });
      const result = await res.json();
      if (result.success) {
        setCareers(result.data);
        setTotalPages(result.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching careers:', error);
      toast({ title: 'Error', description: 'Failed to fetch careers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    if (isAdmin) fetchCareers();
  }, [isAdmin, fetchCareers]);

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'careers');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      const result = await res.json();
      if (result.success) {
        setFormData({ ...formData, image: result.url });
        toast({ title: 'Success', description: 'Image uploaded successfully' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to upload image', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelected = async (file: File) => {
    await handleImageUpload(file);
    setImageSelectorOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.excerpt || !formData.description || !formData.image) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      setFormLoading(true);
      const url = editingCareer
        ? `/api/admin/careers/${editingCareer._id}`
        : '/api/admin/careers';
      const method = editingCareer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        toast({ title: 'Success', description: editingCareer ? 'Career updated successfully' : 'Career created successfully' });
        setIsModalOpen(false);
        setEditingCareer(null);
        setFormData({ title: '', excerpt: '', description: '', image: '', status: 'open' });
        fetchCareers();
      } else {
        toast({ title: 'Error', description: result.error || 'Operation failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error submitting career:', error);
      toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (career: Career) => {
    setEditingCareer(career);
    setFormData({
      title: career.title,
      excerpt: career.excerpt,
      description: career.description,
      image: career.image,
      status: career.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career?')) return;

    try {
      const res = await fetch(`/api/admin/careers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: 'Success', description: 'Career deleted successfully' });
        fetchCareers();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error deleting career:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const openModal = () => {
    setEditingCareer(null);
    setFormData({ title: '', excerpt: '', description: '', image: '', status: 'open' });
    setIsModalOpen(true);
  };

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Access denied</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Career Management</h1>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Career
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search careers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : careers.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg">
            <p className="text-muted-foreground">No careers found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {careers.map((career) => (
              <div key={career._id} className="border border-border rounded-lg p-4 flex gap-4">
                <img
                  src={career.image}
                  alt={career.title}
                  className="w-32 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{career.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{career.excerpt}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      career.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {career.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(career.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(career)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(career._id!)}
                    className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{editingCareer ? 'Edit Career' : 'Add Career'}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Job Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Excerpt *</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image *</label>
                <div className="space-y-2">
                  {formData.image && (
                    <img src={formData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setImageSelectorOpen(true)}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'closed' })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCareer ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
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

export default AdminCareers;
