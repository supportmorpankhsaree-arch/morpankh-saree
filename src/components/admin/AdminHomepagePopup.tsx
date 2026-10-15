"use client";

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2, ImagePlus, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { uploadToR2 } from '@/lib/r2Upload';
import { ImageUploadSelector } from '@/components/ImageUploadSelector';

type PopupState = {
  id: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  isActive: boolean;
};

const AdminHomepagePopup = () => {
  const [state, setState] = useState<PopupState>({ id: null, imageUrl: null, imagePublicId: null, isActive: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);

  const loadPopup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/homepage-popup', {
        headers: { authorization: 'Bearer admin-token' },
      });
      const data = await res.json();

      if (!res.ok || !data?.success) {
        toast({ title: data?.error || 'Failed to load popup', variant: 'destructive' });
        return;
      }

      if (data.data) {
        setState({
          id: data.data._id || data.data.id || null,
          imageUrl: data.data.imageUrl || null,
          imagePublicId: data.data.imagePublicId || null,
          isActive: Boolean(data.data.isActive),
        });
      }
    } catch {
      toast({ title: 'Failed to load popup', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPopup();
  }, []);

  const handleImagePick = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'destructive' });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleImageSelected = async (file: File) => {
    handleImagePick(file);
    setImageSelectorOpen(false);
  };

  const handleSave = async () => {
    if (!selectedFile && !state.imageUrl) {
      toast({ title: 'Please upload an image', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = state.imageUrl || '';
      let imagePublicId = state.imagePublicId || null;

      if (selectedFile) {
        setUploading(true);
        setUploadProgress(0);
        imageUrl = await uploadToR2(selectedFile, { folder: 'homepage-popup', maxBytes: 10 * 1024 * 1024, onProgress: setUploadProgress });
        imagePublicId = null;
        setUploading(false);
      }

      const res = await fetch('/api/admin/homepage-popup', {
        method: state.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({
          id: state.id,
          imageUrl,
          imagePublicId,
          isActive: state.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast({ title: data?.error || 'Failed to save popup', variant: 'destructive' });
        return;
      }

      const popupData = data.data;
      setState({
        id: popupData?._id || popupData?.id || state.id,
        imageUrl: popupData?.imageUrl || imageUrl,
        imagePublicId: popupData?.imagePublicId || imagePublicId,
        isActive: Boolean(popupData?.isActive ?? state.isActive),
      });
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setUploadProgress(0);
      toast({ title: 'Popup saved successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save popup';
      toast({ title: message, variant: 'destructive' });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!state.id) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/homepage-popup?id=${state.id}`, {
        method: 'DELETE',
        headers: { authorization: 'Bearer admin-token' },
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        toast({ title: data?.error || 'Failed to delete popup', variant: 'destructive' });
        return;
      }

      setState({ id: null, imageUrl: null, imagePublicId: null, isActive: true });
      toast({ title: 'Popup deleted successfully' });
    } catch {
      toast({ title: 'Failed to delete popup', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Homepage Popup</h1>
          <p className="text-sm text-muted-foreground">Upload and manage the banner shown on the home page.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={saving || !state.id}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading || (!selectedFile && !state.imageUrl)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50"
          >
            {saving || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving...' : uploading ? `Uploading ${uploadProgress}%` : 'Save'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-10 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading popup settings...
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Enable popup on homepage</p>
                <p className="text-xs text-muted-foreground">The popup will appear whenever the home page is opened.</p>
              </div>
              <button
                type="button"
                onClick={() => setState((current) => ({ ...current, isActive: !current.isActive }))}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${state.isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground'}`}
              >
                {state.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {state.isActive ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium">
              <ImagePlus className="h-4 w-4" /> Upload popup image
            </label>
            <button
              type="button"
              onClick={() => setImageSelectorOpen(true)}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <ImagePlus className="h-4 w-4" /> Choose Image
            </button>
            <p className="mt-2 text-xs text-muted-foreground">Accepted file types: PNG, JPG, WEBP, GIF, AVIF. Maximum size: 10 MB.</p>

            <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 p-4">
              {previewUrl || state.imageUrl ? (
                <img src={previewUrl || state.imageUrl || ''} alt="Popup preview" className="mx-auto max-h-80 w-full rounded-lg object-contain" />
              ) : (
                <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">No popup image selected yet.</div>
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

export default AdminHomepagePopup;
