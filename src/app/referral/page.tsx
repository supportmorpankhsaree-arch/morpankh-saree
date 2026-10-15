"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Users, TrendingUp, Share2, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import PublicLayout from '@/components/PublicLayout';

interface ReferralDataResponse {
  success: boolean;
  referralCode: string;
  stats?: {
    totalReferrals: number;
    totalCoinsEarned: number;
  };
}

const ReferralPage = () => {
  const { isLoggedIn, token } = useStore((s) => ({
    isLoggedIn: s.isLoggedIn,
    token: s.token,
  }));

  const [referralData, setReferralData] = useState<ReferralDataResponse | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referralLink, setReferralLink] = useState('');

  useEffect(() => {
    if (isLoggedIn && token) {
      setReferralLoading(true);
      fetch('/api/referrals', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) {
            if (res.status === 404) {
              console.debug('Referral API endpoint not available');
              return null;
            }
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data?.success) setReferralData(data);
        })
        .catch(err => console.error('Error fetching referral data:', err))
        .finally(() => setReferralLoading(false));
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    if (referralData?.referralCode && typeof window !== 'undefined') {
      setReferralLink(`${window.location.origin}/register?ref=${referralData.referralCode}`);
    }
  }, [referralData]);

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode)
        .then(() => {
          setCopied(true);
          toast({ title: 'Code Copied!', description: 'Your referral code has been copied to the clipboard.' });
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          toast({ title: 'Failed to Copy', description: 'Could not copy the code. Please select and copy it manually.', variant: 'destructive' });
        });
    }
  };

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
        .then(() => {
          toast({ title: 'Link Copied!', description: 'Your referral link has been copied to the clipboard.' });
        })
        .catch(() => {
          toast({ title: 'Failed to Copy', description: 'Could not copy link. Please select and copy it manually.', variant: 'destructive' });
        });
    }
  };

  const shareReferralLink = async () => {
    if (!referralLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Morpankh Saree',
          text: `Use my referral code "${referralData?.referralCode}" to register on Morpankh Saree and earn rewards!`,
          url: referralLink,
        });
        toast({ title: 'Shared successfully!' });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast({ title: 'Failed to share', description: 'Something went wrong while trying to share the link.', variant: 'destructive' });
        }
      }
    } else {
      toast({ title: 'Sharing not supported', description: 'Your browser does not support native sharing. Copy the link instead!', variant: 'destructive' });
    }
  };

  if (!isLoggedIn) {
    return (
      <PublicLayout>
        <div className="container mx-auto py-16 px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">Referral Program</h1>
          <p className="text-base text-muted-foreground mb-6">You need to login to access your referral program.</p>
          <Link href="/login" className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors">
            Go to Login
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="container mx-auto px-4 py-10 lg:px-6">
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>

          <div className="rounded-[20px] border border-[#E5E7EB] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.08)] overflow-hidden">
            <div className="px-6 py-8 sm:px-8 sm:py-10 space-y-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#ECFDF5] shadow-sm text-3xl">
                    🎁
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-600">Referral Program</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Invite friends, earn rewards</h1>
                    <p className="mt-3 text-sm leading-6 text-slate-600 max-w-2xl">Share your referral link with friends and earn Super Coins when they complete their first purchase.</p>
                  </div>
                </div>
                <div className="inline-flex items-center rounded-full bg-[#ECFDF5] px-4 py-2 text-sm font-semibold text-[#0F766E] shadow-sm border border-[#D1FAE5]">
                  <span className="mr-2">⚡</span>
                  Active Program
                </div>
              </div>

              {referralLoading ? (
                <div className="rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] p-10 text-center text-slate-500">Loading referral data...</div>
              ) : referralData ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-gradient-to-br from-[#ECFDF5] to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white shadow-sm text-[#0F766E]">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="mt-4 text-4xl font-extrabold text-slate-900">{referralData.stats?.totalReferrals || 0}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Total Referrals</p>
                    </div>
                    <div className="rounded-[20px] border border-[#E5E7EB] bg-gradient-to-br from-[#F8FAFC] to-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                      <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-white shadow-sm text-[#0F766E]">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <p className="mt-4 text-4xl font-extrabold text-slate-900">{referralData.stats?.totalCoinsEarned || 0}</p>
                      <p className="mt-2 text-sm font-medium text-slate-500">Coins Earned</p>
                      <div className="mt-3 inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 border border-[#E5E7EB]">
                        Worth ₹{referralData.stats?.totalCoinsEarned || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_auto]">
                    <div className="rounded-[20px] border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-6">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500 mb-4">Your Referral Code</p>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex items-center gap-4 rounded-[20px] border border-[#E5E7EB] bg-white px-5 py-4 shadow-sm">
                          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#ECFDF5] text-xl text-[#0F766E]">🎁</div>
                          <span className="text-3xl font-extrabold tracking-[0.18em] text-slate-900">{referralData.referralCode}</span>
                        </div>
                        <Button
                          onClick={copyReferralCode}
                          variant="outline"
                          className="h-12 rounded-[12px] border-[#D1D5DB] bg-white text-[#0F766E] hover:bg-[#ECFDF5] hover:border-[#0F766E] transition"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          {copied ? 'Copied!' : 'Copy Code'}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Your Referral Link</p>
                            <p className="text-sm text-slate-500">Share your link and earn Super Coins when your friend completes their first purchase.</p>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                          <div className="relative rounded-[12px] border border-[#E5E7EB] bg-[#F8FAFC] overflow-hidden">
                            <Input
                              id="referral-link"
                              type="text"
                              value={referralLink}
                              readOnly
                              onClick={(e) => (e.target as HTMLInputElement).select()}
                              className="h-14 w-full border-0 bg-transparent px-4 pr-28 text-sm font-mono text-slate-900 outline-none ring-0 focus:ring-0"
                            />
                            <button
                              onClick={copyReferralLink}
                              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-10 items-center gap-2 rounded-full bg-[#ECFDF5] px-3 text-sm font-medium text-[#0F766E] shadow-sm hover:bg-[#D1FAE5] transition"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4" />
                              Copy
                            </button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Button
                              onClick={copyReferralLink}
                              className="h-12 rounded-[12px] bg-[#0F766E] text-white hover:bg-[#115E58] transition"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </Button>
                            <Button
                              onClick={shareReferralLink}
                              className="h-12 rounded-[12px] bg-[#10B981] text-white hover:bg-[#059669] transition flex items-center justify-center gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              Share Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#D1FAE5] bg-[#ECFDF5] p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">How it works</h3>
                        <p className="text-sm text-slate-600">A simple referral flow with instant rewards.</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      {[
                        { step: '1', title: 'Share Link', description: 'Send your referral link to friends.' },
                        { step: '2', title: 'Friend Registers', description: 'They sign up with your link.' },
                        { step: '3', title: 'First Purchase', description: 'They complete their first order.' },
                        { step: '4', title: 'Earn Super Coins', description: 'You get rewarded instantly.' },
                      ].map((item) => (
                        <div key={item.step} className="rounded-[20px] border border-white bg-white p-4 text-center shadow-sm">
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#D1FAE5] text-sm font-bold text-[#0F766E]">{item.step}</div>
                          <h4 className="text-sm font-semibold text-slate-900 mb-2">{item.title}</h4>
                          <p className="text-xs leading-5 text-slate-500">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#E5E7EB] bg-white p-6 shadow-sm md:grid md:grid-cols-[1fr_auto] md:items-center gap-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#FEF3C7] text-[#B45309] text-2xl">🏅</div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Invite Friends & Earn Rewards!</p>
                        <h3 className="mt-2 text-xl font-bold text-slate-900">The more you refer, the more you earn.</h3>
                        <p className="mt-2 text-sm text-slate-600">⭐ Earn 50 Super Coins for every successful referral.</p>
                      </div>
                    </div>
                    <Button
                      onClick={shareReferralLink}
                      className="h-12 rounded-[12px] bg-[#0F766E] text-white hover:bg-[#115E58] transition"
                    >
                      Share Now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] p-10 text-center text-slate-500">
                  Referral program not available at the moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ReferralPage;
