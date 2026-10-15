"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, Users, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';

interface Referral {
  _id: string;
  referrer_id: string;
  referred_user_id: string;
  referral_code: string;
  status: 'pending' | 'completed' | 'cancelled' | 'fraud';
  reward_given: boolean;
  referrer_reward: number;
  referred_reward: number;
  created_at: string;
  completed_at?: string;
  referrerName: string;
  referrerEmail: string;
  referredUserName: string;
  referredUserEmail: string;
}

const AdminReferralManagement = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter, currentPage]);

  const fetchReferrals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/referrals/management?status=${statusFilter}&page=${currentPage}&pageSize=20`,
        {
          headers: {
            'Authorization': 'Bearer admin-token',
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setReferrals(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      case 'fraud':
        return (
          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            Fraud
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const stats = {
    total: total,
    completed: referrals.filter(r => r.status === 'completed').length,
    pending: referrals.filter(r => r.status === 'pending').length,
    cancelled: referrals.filter(r => r.status === 'cancelled' || r.status === 'fraud').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Referral Management</h1>
            <p className="text-muted-foreground mt-1">View and manage all referral activities</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{stats.cancelled}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="fraud">Fraud</option>
                </select>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">
                Showing {referrals.length} of {total} referrals
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referrals Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Referral List
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading referrals...</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No referrals found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Referral Code</th>
                      <th className="text-left p-4 font-medium">Referrer</th>
                      <th className="text-left p-4 font-medium">Referred User</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Reward Given</th>
                      <th className="text-left p-4 font-medium">Created</th>
                      <th className="text-left p-4 font-medium">Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((referral) => (
                      <tr key={referral._id} className="border-b hover:bg-muted/50">
                        <td className="p-4">
                          <code className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {referral.referral_code}
                          </code>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{referral.referrerName}</div>
                            <div className="text-sm text-muted-foreground">{referral.referrerEmail}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{referral.referredUserName}</div>
                            <div className="text-sm text-muted-foreground">{referral.referredUserEmail}</div>
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(referral.status)}</td>
                        <td className="p-4">
                          {referral.reward_given ? (
                            <div>
                              <div className="text-sm font-medium">Yes</div>
                              <div className="text-xs text-muted-foreground">
                                {referral.referrer_reward} / {referral.referred_reward} coins
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </td>
                        <td className="p-4 text-sm">{formatDate(referral.created_at)}</td>
                        <td className="p-4 text-sm">{formatDate(referral.completed_at || '')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReferralManagement;
