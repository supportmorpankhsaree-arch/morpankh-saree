"use client";

import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';
import { initialOrders } from '@/data/mockData';
import { Product } from '@/data/mockData';

// Define order type
type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: { productId: string; name: string; image?: string; color: string; size?: string; quantity: number; price: number }[];
  subtotal: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
};



const AdminDashboard = () => {
  const { reviews } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<(Product & { _id?: string; stock?: number; hidden?: boolean })[]>([]);
  const [customers, setCustomers] = useState<{ email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [razorpayTodayCount, setRazorpayTodayCount] = useState<number | null>(null);
  const [razorpayTodayRevenue, setRazorpayTodayRevenue] = useState<number | null>(null);
  const [razorpayLoading, setRazorpayLoading] = useState(true);
  const [razorpayError, setRazorpayError] = useState<string | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<(Product & { _id?: string; stock: number; hidden?: boolean })[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);

  // Fetch real low stock products (10 max for dashboard)
  useEffect(() => {
    const fetchLowStock = async () => {
      setLowStockLoading(true);
      try {
        const response = await fetch('/api/admin/inventory/low-stock?dashboard=true', {
          headers: {
            'Authorization': 'Bearer admin-token'
          }
        });
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          setLowStockAlerts(result.data);
        } else {
          setLowStockAlerts([]);
        }
      } catch (error) {
        console.error('Error fetching low stock:', error);
        setLowStockAlerts([]);
      } finally {
        setLowStockLoading(false);
      }
    };

    fetchLowStock();
  }, []);
  
  // Fetch real orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('/api/admin/orders?pageSize=10000', {
          headers: {
            'Authorization': 'Bearer admin-token'
          }
        });
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          // Use real data if available
          setOrders(result.data);
        } else {
          // Fallback to mock data if API fails or returns no data
          console.log('Using mock data fallback');
          setOrders(initialOrders);
        }
      } catch (error) {
        console.log('API error, using mock data fallback:', error);
        // Fallback to mock data on network error
        setOrders(initialOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch real products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/admin/products?pageSize=10000', {
          headers: {
            'Authorization': 'Bearer admin-token'
          }
        });
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          setProducts(result.data);
        } else {
          console.log('Failed to fetch products');
          setProducts([]);
        }
      } catch (error) {
        console.log('Error fetching products:', error);
        setProducts([]);
      }
    };

    fetchProducts();
  }, []);

  // Fetch real customers from database
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/auth/profile', {
          headers: {
            'Authorization': 'Bearer admin-token'
          }
        });
        // If no dedicated customers API, we'll count unique customers from orders
        const uniqueCustomers = new Set(orders.map(o => o.customerEmail));
        setCustomers(Array.from(uniqueCustomers).map(email => ({ email })));
      } catch (error) {
        console.log('Error fetching customers:', error);
        // Fallback: count unique customers from orders
        const uniqueCustomers = new Set(orders.map(o => o.customerEmail));
        setCustomers(Array.from(uniqueCustomers).map(email => ({ email })));
      }
    };

    if (orders.length > 0) {
      fetchCustomers();
    }
  }, [orders]);

  useEffect(() => {
    const fetchRazorpaySummary = async () => {
      setRazorpayLoading(true);
      setRazorpayError(null);

      try {
        const response = await fetch('/api/admin/razorpay-summary', {
          headers: {
            'Authorization': 'Bearer admin-token'
          }
        });
        const result = await response.json();

        if (response.ok && result?.success) {
          setRazorpayTodayCount(Number(result.count) || 0);
          setRazorpayTodayRevenue(Number(result.revenue) || 0);
        } else {
          console.error('Razorpay summary error', result);
          setRazorpayError(result?.error || 'Unable to fetch Razorpay summary');
        }
      } catch (error) {
        console.error('Razorpay summary fetch failed', error);
        setRazorpayError('Unable to fetch Razorpay summary');
      } finally {
        setRazorpayLoading(false);
      }
    };

    fetchRazorpaySummary();
  }, []);
  
  // Sort orders by date (most recent first)
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA; // Most recent first
  });
  
  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  // Helper function for today's date comparison
  const isToday = (dateString: string) => {
    const orderDate = new Date(dateString);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  };
  
  const totalRevenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.total, 0);
  const todayPaidOrders = orders.filter((o) => isToday(o.date) && o.paymentStatus === 'paid');
  const todayOrdersCount = razorpayTodayCount !== null ? razorpayTodayCount : todayPaidOrders.length;
  const todayRevenue = razorpayTodayRevenue !== null ? razorpayTodayRevenue : todayPaidOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingReviews = reviews.filter((r) => !r.approved);

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) => (
    <div className="bg-card rounded-xl p-5 border border-border card-hover">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${color}`}><Icon className="h-5 w-5" /></div>
        <div><p className="text-sm text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></div>
      </div>
    </div>
  );

  const statusColor = (status: string) => {
    const map: Record<string, string> = { pending: 'bg-gold/20 text-gold', paid: 'bg-primary/20 text-primary', confirmed: 'bg-primary/20 text-primary', shipped: 'bg-secondary/20 text-secondary', delivered: 'bg-peacock-green/20 text-peacock-green', cancelled: 'bg-destructive/20 text-destructive' };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Dashboard</h1>

      {/* Today */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-card rounded-xl p-6 border border-border gradient-hero text-primary-foreground">
          <p className="text-sm opacity-80">Today's Orders</p>
          <p className="text-3xl font-bold">{razorpayLoading ? '...' : todayOrdersCount}</p>
          <p className="mt-2 text-xs opacity-80">{razorpayLoading ? 'Fetching Razorpay captured payments...' : razorpayError ? `Razorpay error: ${razorpayError}` : 'Source: Razorpay captured payments'}</p>
        </div>
        <div className="bg-card rounded-xl p-6 border border-border gradient-saffron text-secondary-foreground">
          <p className="text-sm opacity-80">Today's Revenue</p>
          <p className="text-3xl font-bold">₹{todayRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={ShoppingCart} label="Total Orders" value={orders.length.toString()} color="bg-primary/10 text-primary" />
        <StatCard icon={Package} label="Total Products" value={products.filter(p => !p.hidden).length.toString()} color="bg-secondary/10 text-secondary" />
        <StatCard icon={Users} label="Total Customers" value={customers.length.toString()} color="bg-accent/10 text-accent" />
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${totalRevenue.toLocaleString()}`} color="bg-peacock-green/10 text-peacock-green" />
        <StatCard icon={TrendingUp} label="Total Profit" value={`₹${Math.round(totalRevenue * 0.3).toLocaleString()}`} color="bg-gold/10 text-gold" />
      </div>

      {/* Pending Reviews Alert */}
      {pendingReviews.length > 0 && (
        <Link href="/admin/reviews" className="block mb-6 bg-secondary/10 border border-secondary/30 rounded-xl p-4 hover:bg-secondary/15 transition-colors">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-secondary" />
            <div>
              <p className="font-medium text-sm">{pendingReviews.length} review{pendingReviews.length > 1 ? 's' : ''} pending approval</p>
              <p className="text-xs text-muted-foreground">Click to review and approve</p>
            </div>
          </div>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="font-display text-lg font-semibold mb-4">Recent Orders</h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors rounded-lg px-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">₹{order.total.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {sortedOrders.length > 5 && (
            <div className="mt-4 text-center">
              <Link href="/admin/orders" className="text-sm text-primary hover:underline">
                View all {sortedOrders.length} orders →
              </Link>
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-gold" /> Low Stock Alert
            </h2>
            {lowStockAlerts.length > 0 && (
              <Link href="/admin/low-stock" className="text-xs text-primary hover:underline font-semibold">
                View All →
              </Link>
            )}
          </div>

          {lowStockLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : lowStockAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No low stock products found.</p>
          ) : (
            <div className="space-y-3">
              {lowStockAlerts.map((p, index) => {
                const hasImage = p.images && p.images.length > 0;
                const colorText = typeof p.colors?.[0] === 'string'
                  ? p.colors[0]
                  : p.colors?.[0]?.colorName || '';

                return (
                  <div key={p.id || index} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/10 rounded-lg px-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center">
                        {hasImage ? (
                          <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.sku || 'No SKU'} {colorText ? `· ${colorText}` : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0 ml-4">
                      <p className={`font-bold text-sm ${p.stock <= 2 ? 'text-destructive' : 'text-gold'}`}>
                        {p.stock} left
                      </p>
                      <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        p.stock <= 2 
                          ? 'bg-destructive/10 text-destructive border border-destructive/20' 
                          : 'bg-gold/10 text-gold border border-gold/20'
                      }`}>
                        {p.stock <= 2 ? '🔴 Critical' : '🟡 Low'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
