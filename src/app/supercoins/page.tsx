"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Coins, TrendingUp, RotateCcw, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PublicLayout from '@/components/PublicLayout';

interface SuperCoinTransaction {
  id: string;
  transactionType: string;
  coins: number;
  description: string;
  status: string;
  createdAt: string;
}

interface SuperCoinsResponse {
  success: boolean;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  transactions: SuperCoinTransaction[];
}

const SuperCoinsPage = () => {
  const { isLoggedIn, token } = useStore((s) => ({
    isLoggedIn: s.isLoggedIn,
    token: s.token,
  }));

  const [superCoinsData, setSuperCoinsData] = useState<SuperCoinsResponse | null>(null);
  const [superCoinsLoading, setSuperCoinsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLoggedIn && token) {
      setSuperCoinsLoading(true);
      fetch('/api/profile/supercoins', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              console.debug('Super Coins API endpoint not available');
              return null;
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data?.success) {
            setSuperCoinsData(data);
          }
        })
        .catch((err) => {
          console.error('Error fetching supercoins:', err);
        })
        .finally(() => setSuperCoinsLoading(false));
    }
  }, [isLoggedIn, token]);

  const copyBalance = () => {
    if (!superCoinsData) return;
    navigator.clipboard
      .writeText(String(superCoinsData.balance))
      .then(() => {
        setCopied(true);
        toast({ title: 'Balance Copied!', description: 'Your Super Coins balance has been copied.' });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast({ title: 'Copy Failed', description: 'Unable to copy balance. Please try again.', variant: 'destructive' });
      });
  };

  if (!isLoggedIn) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">My Super Coins</h1>
          <p className="text-base text-slate-600 mb-6">Login to see your Super Coins balance, earnings, and recent activity.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/login" className="inline-flex items-center justify-center rounded-[12px] bg-[#0F766E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#115E58] transition">
              Login
            </Link>
            <Link href="/register" className="inline-flex items-center justify-center rounded-[12px] border border-[#D1D5DB] bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
              Register
            </Link>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#F8FAFC] py-10">
        <div className="container mx-auto px-4 lg:px-6">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>

          <div className="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-6 py-8 sm:px-8 sm:py-10 space-y-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#ECFDF5] shadow-sm text-3xl text-[#0F766E]">
                    <Coins />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">My Super Coins</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Your Super Coins dashboard</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600 max-w-2xl">Track your balance, earnings, redemptions, and recent rewards activity with one clean view.</p>
                  </div>
                </div>
                <Link href="/products" className="inline-flex h-11 items-center justify-center rounded-[12px] bg-[#10B981] px-5 text-sm font-semibold text-white hover:bg-[#059669] transition">
                  Earn More Coins
                </Link>
              </div>

              {superCoinsLoading ? (
                <div className="rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] p-10 text-center text-slate-500">Loading Super Coins...</div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-gradient-to-br from-[#ECFDF5] to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white shadow-sm text-[#0F766E]">
                        <Coins className="w-5 h-5" />
                      </div>
                      <p className="mt-4 text-4xl font-extrabold text-slate-900">{superCoinsData?.balance ?? 0}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Current Balance</p>
                      <button
                        type="button"
                        onClick={copyBalance}
                        className="mt-4 inline-flex items-center gap-2 rounded-[12px] bg-white px-3 py-2 text-sm font-medium text-[#0F766E] shadow-sm hover:bg-[#ECFDF5] transition"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied' : 'Copy Balance'}
                      </button>
                    </div>
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white shadow-sm text-[#0F766E]">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="mt-4 text-4xl font-extrabold text-green-600">{superCoinsData?.totalEarned ?? 0}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Total Earned</p>
                    </div>
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-gradient-to-br from-white to-[#F8FAFC] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white shadow-sm text-[#0F766E]">
                        <RotateCcw className="w-5 h-5 text-orange-500" />
                      </div>
                      <p className="mt-4 text-4xl font-extrabold text-orange-500">{superCoinsData?.totalRedeemed ?? 0}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Total Redeemed</p>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#D1FAE5] bg-[#ECFDF5] p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#0F766E] shadow-sm">
                        <Coins className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">How to grow your Super Coins</h2>
                        <p className="text-sm text-slate-600">Earn rewards by shopping, referring friends, and engaging with offers.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { title: 'Shop & Earn', description: 'Earn coins on every eligible purchase.' },
                        { title: 'Refer Friends', description: 'Send your referral link for bonus coins.' },
                        { title: 'Redeem Rewards', description: 'Use coins to save on your next order.' },
                      ].map((item) => (
                        <div key={item.title} className="rounded-[20px] bg-white p-4 shadow-sm border border-[#E5E7EB]">
                          <p className="text-sm font-semibold text-slate-900 mb-2">{item.title}</p>
                          <p className="text-xs leading-5 text-slate-500">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Recent Super Coins Activity</h3>
                        <p className="text-sm text-slate-600">Latest rewards, earnings, and redemptions.</p>
                      </div>
                      <Link href="/referral" className="text-sm font-semibold text-[#0F766E] hover:text-[#115E58]">
                        View referral rewards
                      </Link>
                    </div>
                    {superCoinsData?.transactions && superCoinsData.transactions.length > 0 ? (
                      <div className="space-y-3">
                        {superCoinsData.transactions.map((tx) => (
                          <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{tx.description}</p>
                              <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${tx.transactionType === 'Redeem' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {tx.transactionType}
                              </span>
                              <span className={`text-lg font-bold ${tx.transactionType === 'Redeem' ? 'text-orange-500' : 'text-emerald-700'}`}>
                                {tx.transactionType === 'Redeem' ? '-' : '+'}{tx.coins}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No transactions yet. Start earning coins by shopping or referring friends.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default SuperCoinsPage;
