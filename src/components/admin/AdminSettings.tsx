"use client";

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, ShieldAlert, Laptop } from 'lucide-react';
import { updateClientSettingsCache } from '@/components/MaintenanceGuard';

const AdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { authorization: 'Bearer admin-token' },
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Error loading settings',
          description: data?.error || 'Could not fetch settings',
          variant: 'destructive',
        });
        return;
      }

      setMaintenanceMode(Boolean(data.maintenanceMode));
    } catch (err) {
      toast({
        title: 'Error loading settings',
        description: 'Network error or server unavailable',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({ maintenanceMode, updatedBy: 'admin' }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: 'Failed to update settings',
          description: data?.error || 'Could not save website settings',
          variant: 'destructive',
        });
        return;
      }

      // Update local client cache immediately
      updateClientSettingsCache(data.maintenanceMode);

      toast({
        title: 'Settings Saved',
        description: 'Website settings updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Failed to save settings',
        description: 'A network error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Website Settings</h1>
          <p className="text-sm text-muted-foreground">Manage public store configuration and system settings.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card border border-border rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* Glassmorphic Settings Card */}
          <div className="bg-card/75 backdrop-blur-md rounded-xl border border-border p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Laptop className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Website Maintenance Mode</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Temporarily take the public storefront offline for scheduled maintenance.
                </p>
              </div>
            </div>

            <div className="border-t border-border/80 my-5" />

            {/* Toggle Switch Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-2">
              <div className="max-w-md">
                <span className="text-sm font-medium block">Maintenance Mode</span>
                <p className="text-xs text-muted-foreground mt-1">
                  When Maintenance Mode is enabled, all public website pages will be temporarily unavailable. Visitors will only see the Maintenance Page.
                </p>
              </div>

              {/* Modern Animated Toggle Switch */}
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${!maintenanceMode ? 'text-foreground' : 'text-muted-foreground'}`}>
                  OFF
                </span>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-card border-border/50 ${
                    maintenanceMode ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${
                      maintenanceMode ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${maintenanceMode ? 'text-emerald-500 font-bold' : 'text-muted-foreground'}`}>
                  ON
                </span>
              </div>
            </div>

            {/* Shield warning when ON */}
            {maintenanceMode && (
              <div className="mt-6 flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Warning: Storefront is hidden</span>
                  <span>All public URLs (homepage, products, cart, checkout) will redirect to `/maintenance`. Admins can continue accessing the backend dashboard to disable this later.</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 bg-muted/40 p-4 border border-border rounded-xl">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 min-w-[150px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSettings;
