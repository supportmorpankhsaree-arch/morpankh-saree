'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Coins, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalCoinsIssued: number;
  totalCoinsRedeemed: number;
  totalUsers: number;
  activeUsers: number;
  averageBalance: number;
  totalTransactions: number;
}

export default function RewardAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/rewards/analytics', {
        headers: { authorization: 'Bearer admin-token' },
      });
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6">Failed to load analytics</div>;
  }

  const stats = [
    { label: 'Total Coins Issued', value: data.totalCoinsIssued, icon: Coins, color: 'text-purple-600' },
    { label: 'Total Coins Redeemed', value: data.totalCoinsRedeemed, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Users', value: data.totalUsers, icon: Users, color: 'text-blue-600' },
    { label: 'Active Users', value: data.activeUsers, icon: Users, color: 'text-orange-600' },
    { label: 'Average Balance', value: Math.round(data.averageBalance), icon: Coins, color: 'text-teal-600' },
    { label: 'Total Transactions', value: data.totalTransactions, icon: BarChart3, color: 'text-indigo-600' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-purple-600" />
        <h1 className="text-2xl font-bold">Super Coins Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value.toLocaleString()}</p>
              </div>
              <stat.icon className={`w-10 h-10 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
