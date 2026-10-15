'use client';

import { useState, useEffect } from 'react';
import { Coins, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { toast } from '@/hooks/use-toast';

interface RewardSlab {
  orderAmount: number;
  coinsEarned: number;
}

interface RewardSettings {
  enabled: boolean;
  rewardType: 'fixed' | 'percentage';
  coinValue: number;
  minimumOrderValue: number;
  minimumCoinsRedeem: number;
  maximumDiscountValue: number;
  slabs: RewardSlab[];
}

export default function RewardSettingsPage() {
  const [settings, setSettings] = useState<RewardSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/rewards/settings', {
        headers: { authorization: 'Bearer admin-token' },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);

    try {
      const res = await fetch('/api/admin/rewards/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast({ title: 'Settings saved successfully' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: data?.error || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addSlab = () => {
    if (!settings) return;
    setSettings({
      ...settings,
      slabs: [...(settings.slabs || []), { orderAmount: 0, coinsEarned: 0 }],
    });
  };

  const removeSlab = (index: number) => {
    if (!settings || !settings.slabs) return;
    setSettings({
      ...settings,
      slabs: settings.slabs.filter((_, i) => i !== index),
    });
  };

  const updateSlab = (index: number, field: keyof RewardSlab, value: number) => {
    if (!settings || !settings.slabs) return;
    const newSlabs = [...settings.slabs];
    newSlabs[index] = { ...newSlabs[index], [field]: value };
    setSettings({ ...settings, slabs: newSlabs });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!settings) {
    return (
      <AdminLayout>
        <p className="text-muted-foreground">Failed to load settings.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <Coins className="h-6 w-6 text-primary" />
        <h1 className="font-display text-2xl font-bold">Super Coins Settings</h1>
      </div>

      {/* Main Settings Card */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">

        {/* Enable Toggle */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <p className="font-medium text-sm">Enable Super Coins System</p>
            <p className="text-xs text-muted-foreground mt-0.5">Allow customers to earn and redeem Super Coins on orders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Core Settings Grid */}
        <div>
          <h2 className="font-display text-lg font-semibold mb-4">Core Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Reward Type</label>
              <select
                value={settings.rewardType}
                onChange={(e) =>
                  setSettings({ ...settings, rewardType: e.target.value as 'fixed' | 'percentage' })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              >
                <option value="fixed">Fixed Slab</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Coin Value (₹ per coin)</label>
              <input
                type="number"
                value={settings.coinValue ?? 0}
                onChange={(e) => setSettings({ ...settings, coinValue: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Minimum Order Value (₹)</label>
              <input
                type="number"
                value={settings.minimumOrderValue ?? 0}
                onChange={(e) =>
                  setSettings({ ...settings, minimumOrderValue: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Minimum Coins to Redeem</label>
              <input
                type="number"
                value={settings.minimumCoinsRedeem ?? 0}
                onChange={(e) =>
                  setSettings({ ...settings, minimumCoinsRedeem: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Maximum Discount Value (₹)</label>
              <input
                type="number"
                value={settings.maximumDiscountValue ?? 0}
                onChange={(e) =>
                  setSettings({ ...settings, maximumDiscountValue: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </div>
          </div>
        </div>

        {/* Reward Slabs */}
        <div className="border-t border-border pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Reward Slabs</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Define coins earned per order amount tier</p>
            </div>
            <button
              onClick={addSlab}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Slab
            </button>
          </div>

          <div className="space-y-3">
            {settings.slabs && settings.slabs.length > 0 ? (
              settings.slabs.map((slab, index) => (
                <div
                  key={index}
                  className="flex items-end gap-4 p-4 bg-muted/30 rounded-xl border border-border"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Order Amount (₹)</label>
                    <input
                      type="number"
                      value={slab.orderAmount ?? 0}
                      onChange={(e) => updateSlab(index, 'orderAmount', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Coins Earned</label>
                    <input
                      type="number"
                      value={slab.coinsEarned ?? 0}
                      onChange={(e) => updateSlab(index, 'coinsEarned', Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
                    />
                  </div>
                  <button
                    onClick={() => removeSlab(index)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    aria-label="Remove slab"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                No slabs configured. Click &quot;Add Slab&quot; to get started.
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-border pt-6 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
