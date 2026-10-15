"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Gift, Users, TrendingUp, Shield } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface ReferralSettings {
  enabled: boolean;
  referrerReward: number;
  referredUserReward: number;
  minimumOrderValue: number;
  firstOrderOnly: boolean;
  maxReferralReward: number;
  dailyReferralLimit: number;
  monthlyReferralLimit: number;
  allowSelfReferral: boolean;
}

const AdminReferralSettings = () => {
  const [settings, setSettings] = useState<ReferralSettings>({
    enabled: false,
    referrerReward: 100,
    referredUserReward: 50,
    minimumOrderValue: 0,
    firstOrderOnly: true,
    maxReferralReward: 1000,
    dailyReferralLimit: 10,
    monthlyReferralLimit: 50,
    allowSelfReferral: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/referrals/settings', {
        headers: {
          'Authorization': 'Bearer admin-token',
        },
      });
      const data = await response.json();
      if (response.ok) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/referrals/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Referral Settings</h1>
            <p className="text-muted-foreground mt-1">Configure your referral program rewards and rules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Settings Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Reward Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="enabled" className="text-base font-medium">Enable Referral Program</Label>
                  <p className="text-sm text-muted-foreground mt-1">Turn on the referral system for users</p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referrerReward">Referrer Reward (Coins)</Label>
                  <Input
                    id="referrerReward"
                    type="number"
                    value={settings.referrerReward}
                    onChange={(e) => setSettings({ ...settings, referrerReward: Number(e.target.value) })}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Coins given to the referrer</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referredUserReward">Referred User Reward (Coins)</Label>
                  <Input
                    id="referredUserReward"
                    type="number"
                    value={settings.referredUserReward}
                    onChange={(e) => setSettings({ ...settings, referredUserReward: Number(e.target.value) })}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Coins given to the new user</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumOrderValue">Minimum Order Value (₹)</Label>
                <Input
                  id="minimumOrderValue"
                  type="number"
                  value={settings.minimumOrderValue}
                  onChange={(e) => setSettings({ ...settings, minimumOrderValue: Number(e.target.value) })}
                  min={0}
                />
                <p className="text-xs text-muted-foreground">Minimum order value required to qualify for referral reward</p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="firstOrderOnly" className="text-base font-medium">First Order Only</Label>
                  <p className="text-sm text-muted-foreground mt-1">Only reward for the first order of referred users</p>
                </div>
                <Switch
                  id="firstOrderOnly"
                  checked={settings.firstOrderOnly}
                  onCheckedChange={(checked) => setSettings({ ...settings, firstOrderOnly: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Limits Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Limits & Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxReferralReward">Max Reward per User (Coins)</Label>
                <Input
                  id="maxReferralReward"
                  type="number"
                  value={settings.maxReferralReward}
                  onChange={(e) => setSettings({ ...settings, maxReferralReward: Number(e.target.value) })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyReferralLimit">Daily Referral Limit</Label>
                <Input
                  id="dailyReferralLimit"
                  type="number"
                  value={settings.dailyReferralLimit}
                  onChange={(e) => setSettings({ ...settings, dailyReferralLimit: Number(e.target.value) })}
                  min={0}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthlyReferralLimit">Monthly Referral Limit</Label>
                <Input
                  id="monthlyReferralLimit"
                  type="number"
                  value={settings.monthlyReferralLimit}
                  onChange={(e) => setSettings({ ...settings, monthlyReferralLimit: Number(e.target.value) })}
                  min={0}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="allowSelfReferral" className="text-sm font-medium">Allow Self-Referral</Label>
                  <p className="text-xs text-muted-foreground mt-1">Allow users to refer themselves</p>
                </div>
                <Switch
                  id="allowSelfReferral"
                  checked={settings.allowSelfReferral}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowSelfReferral: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referrer Reward</p>
                  <p className="text-2xl font-bold">{settings.referrerReward} coins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New User Reward</p>
                  <p className="text-2xl font-bold">{settings.referredUserReward} coins</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Gift className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-2xl font-bold">{settings.enabled ? 'Active' : 'Disabled'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div>
            {message && (
              <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminReferralSettings;
