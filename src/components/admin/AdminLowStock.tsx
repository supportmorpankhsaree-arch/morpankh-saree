"use client";

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  Search, 
  Package, 
  Eye, 
  Pencil, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  AlertTriangle,
  Filter,
  X
} from 'lucide-react';
import { Category } from '@/lib/api';

type ColorVariantItem = string | {
  colorName: string;
  stock?: number;
  images?: string[];
};

type LowStockProduct = {
  _id: string;
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  colors?: ColorVariantItem[];
  images?: string[];
  updatedAt: string;
};

const AdminLowStock = () => {
  // Queries & Filters
  const [search, setSearch] = useState('');
  const [skuSearch, setSkuSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('lowest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  
  // Data
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);

  // Fetch Categories
  useEffect(() => {
    const loadCategories = async () => {
      setCatLoading(true);
      try {
        const res = await fetch('/api/categories');
        const result = await res.json();
        if (res.ok && result?.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setCatLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Fetch Low Stock Products
  const loadLowStock = useCallback(async () => {
    setLoading(true);
    try {
      // Build search params
      const searchParams = new URLSearchParams();
      
      // Combine name search and SKU search for the backend query if needed, or query them separately
      // The backend accepts search. If both search and skuSearch are present, we can merge them or handle search parameter
      const combinedSearch = (search || skuSearch) ? `${search} ${skuSearch}`.trim() : '';
      if (combinedSearch) searchParams.append('search', combinedSearch);
      if (category) searchParams.append('category', category);
      if (status) searchParams.append('status', status);
      if (sortBy) searchParams.append('sortBy', sortBy);
      searchParams.append('page', page.toString());
      searchParams.append('pageSize', pageSize.toString());

      const res = await fetch(`/api/admin/inventory/low-stock?${searchParams.toString()}`, {
        headers: { authorization: 'Bearer admin-token' },
      });
      const result = await res.json();

      if (res.ok && result?.success) {
        setProducts(result.data || []);
        setTotal(result.pagination?.total || 0);
        setTotalPages(result.pagination?.totalPages || 1);
      } else {
        toast({
          title: 'Error loading inventory',
          description: result?.error || 'Failed to query low stock products',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Error loading inventory',
        description: 'Network error or server unavailable',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [category, status, sortBy, page, pageSize, search, skuSearch]);

  // Trigger search on filter changes or page alterations
  useEffect(() => {
    loadLowStock();
  }, [loadLowStock]);

  // Handle manual Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLowStock();
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSkuSearch('');
    setCategory('');
    setStatus('');
    setSortBy('lowest');
    setPage(1);
  };

  const getCategoryName = (categoryId: string) => {
    const found = categories.find(c => c.id === categoryId || c.slug === categoryId);
    return found ? found.name : 'Unknown';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-gold" /> Low Stock Products
          </h1>
          <p className="text-sm text-muted-foreground">Manage and reorder items approaching critical inventory limits.</p>
        </div>
      </div>

      {/* Search and Filters Panel */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Search by Product Name */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Product Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Search by SKU */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">SKU / Code</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search SKU..."
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Filter by Category */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {Array.from(new Map((categories || []).map((c) => [c.id || c.slug, c])).values()).map((c, idx) => (
                  <option key={`cat-opt-${c.id || c.slug}-${idx}`} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Stock Status */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Stock Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All Thresholds</option>
                <option value="critical">🔴 Critical (Stock ≤ 2)</option>
                <option value="low">🟡 Low (Stock 3–5)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
            {/* Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpDown className="h-3.5 w-3.5" /> Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-background border border-border rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="lowest">Lowest Stock</option>
                <option value="highest">Highest Stock</option>
                <option value="recent">Recently Updated</option>
                <option value="name">Product Name</option>
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg transition-colors font-semibold"
              >
                <Filter className="h-3.5 w-3.5" /> Apply Search
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Table Card */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading low stock products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <Package className="h-12 w-12 text-muted-foreground/45 mb-3" />
            <h3 className="font-semibold text-base mb-1">No low stock products found.</h3>
            <p className="text-sm text-muted-foreground max-w-xs">All matching inventory items are currently well stocked above configured limits.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="p-4 w-16">Image</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Current Stock</th>
                    <th className="p-4 text-center">Threshold</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Last Updated</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p, idx) => {
                    const hasImage = p.images && p.images.length > 0;
                    const variantText = typeof p.colors?.[0] === 'string'
                      ? p.colors[0]
                      : p.colors?.[0]?.colorName || '';

                    return (
                      <tr key={`low-stock-prod-${p.id || idx}-${idx}`} className="hover:bg-muted/30 transition-colors">
                        {/* Image */}
                        <td className="p-4">
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-border bg-muted flex items-center justify-center shrink-0">
                            {hasImage ? (
                              <img src={p.images![0]} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="p-4 font-medium max-w-xs md:max-w-md">
                          <p className="line-clamp-1">{p.name}</p>
                          {variantText && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-semibold mt-1 inline-block">
                              {variantText}
                            </span>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="p-4 font-mono text-xs">{p.sku || 'N/A'}</td>

                        {/* Category */}
                        <td className="p-4 text-muted-foreground">{getCategoryName(p.category)}</td>

                        {/* Current Stock */}
                        <td className="p-4 text-center">
                          <span className={`font-bold ${p.stock <= 2 ? 'text-destructive font-extrabold' : 'text-amber-500'}`}>
                            {p.stock}
                          </span>
                        </td>

                        {/* Low Stock Threshold */}
                        <td className="p-4 text-center text-muted-foreground">5</td>

                        {/* Status Badge */}
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            p.stock <= 2
                              ? 'bg-destructive/10 text-destructive border border-destructive/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${p.stock <= 2 ? 'bg-destructive' : 'bg-amber-500'}`} />
                            {p.stock <= 2 ? 'Critical' : 'Low'}
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="p-4 text-xs text-muted-foreground">{formatDate(p.updatedAt)}</td>

                        {/* Action buttons */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Product (Storefront) */}
                            <a
                              href={`/product/${p.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="View Product"
                              className="p-1.5 text-muted-foreground hover:text-foreground border border-border hover:bg-muted rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                            
                            {/* Edit Product (Navigates and searches inside products database manager) */}
                            <Link
                              href={`/admin/products?search=${encodeURIComponent(p.sku || p.name)}`}
                              title="Edit Product"
                              className="p-1.5 text-muted-foreground hover:text-primary border border-border hover:bg-muted rounded-lg transition-colors"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-border flex items-center justify-between gap-4 flex-col sm:flex-row text-sm">
              <span className="text-muted-foreground text-xs">
                Showing <span className="font-semibold text-foreground">{products.length}</span> of{' '}
                <span className="font-semibold text-foreground">{total}</span> records
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = page === pageNum;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground font-bold'
                            : 'border border-border hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminLowStock;
