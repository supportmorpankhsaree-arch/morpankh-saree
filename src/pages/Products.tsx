"use client";



import { useState, useEffect } from 'react';

import { SlidersHorizontal, X, Search, ShoppingBag, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

import PublicLayout from '@/components/PublicLayout';
import PageBanner from '@/components/PageBanner';
import ProductCard from '@/components/ProductCard';

import { useStore } from '@/store/useStore';

import { Category, Product, initialProducts, initialCategories } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';



const highlightFilters = [

  { label: 'Best Seller', key: 'featured' },

  { label: 'Limited Offer', key: 'limited' },

  { label: 'Sale', key: 'sale' },

  { label: 'New Arrival', key: 'new' },

  { label: 'Trending', key: 'trending' },

  { label: 'Premium', key: 'premium' },

  { label: 'Live Special', key: 'liveSpecial' },

];



const Products = ({ initialCategory = '', initialHighlight = '', initialSearch = '' }: { initialCategory?: string; initialHighlight?: string; initialSearch?: string }) => {

  const storeCategories = useStore((s) => s.categories);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const [selectedHighlight, setSelectedHighlight] = useState(initialHighlight);

  const [sortBy, setSortBy] = useState('');

  const [selectedSize, setSelectedSize] = useState('');

  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  const [filterOpen, setFilterOpen] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState(initialSearch);

  const [minPriceInput, setMinPriceInput] = useState('');

  const [maxPriceInput, setMaxPriceInput] = useState('');

  const [minPriceFilter, setMinPriceFilter] = useState(0);

  const [maxPriceFilter, setMaxPriceFilter] = useState(0);

  const [priceError, setPriceError] = useState('');

  const [page, setPage] = useState(1);



  const maxPrice = 10000;



  const clearFilters = () => {

    setSelectedCategory('');

    setSelectedHighlight('');

    setSelectedSize('');

    setAvailableSizes([]);

    setSearchQuery('');

    setMinPriceInput('');

    setMaxPriceInput('');

    setMinPriceFilter(0);

    setMaxPriceFilter(0);

    setPriceError('');

    setSortBy('');

    setPage(1);

  };

  const handleApplyPriceFilter = () => {

    setPriceError('');

    const min = minPriceInput.trim() ? Number(minPriceInput) : 0;

    const max = maxPriceInput.trim() ? Number(maxPriceInput) : 0;

    if (minPriceInput.trim() && (isNaN(min) || min < 0)) {

      setPriceError('Minimum price must be a positive number');

      return;

    }

    if (maxPriceInput.trim() && (isNaN(max) || max < 0)) {

      setPriceError('Maximum price must be a positive number');

      return;

    }

    if (minPriceInput.trim() && maxPriceInput.trim() && min > max) {

      setPriceError('Minimum price cannot be greater than maximum price');

      return;

    }

    setMinPriceFilter(min);

    setMaxPriceFilter(max);

    setPage(1);

  };

  const handleResetPrice = () => {

    setMinPriceInput('');

    setMaxPriceInput('');

    setMinPriceFilter(0);

    setMaxPriceFilter(0);

    setPriceError('');

    setPage(1);

  };



  const hasActiveFilters = selectedCategory || selectedHighlight || selectedSize || searchQuery || minPriceFilter > 0 || maxPriceFilter > 0;



  const pageSize = 12;

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, selectedSize, selectedHighlight, sortBy, searchQuery, minPriceFilter, maxPriceFilter]);

  useEffect(() => {
    const loadProducts = async () => {
      setProductsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(pageSize));
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedHighlight) params.set('highlight', selectedHighlight);
        if (searchQuery.trim()) params.set('search', searchQuery.trim());
        if (sortBy) params.set('sort', sortBy);
        if (selectedSize) params.set('size', selectedSize);
        if (minPriceFilter > 0) params.set('minPrice', String(minPriceFilter));
        if (maxPriceFilter > 0) params.set('maxPrice', String(maxPriceFilter));

        const response = await fetch(`/api/products?${params.toString()}`);
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setProducts(result.data as Product[]);
          setTotalProducts(Number(result.pagination?.total) || result.data.length);
          setTotalPages(Number(result.pagination?.totalPages) || 1);
          return;
        }
      } catch {
        // ignore
      } finally {
        setProductsLoading(false);
      }

      // Fallback to client-side filtering on initialProducts
      let filtered = [...initialProducts];
      if (selectedCategory) {
        filtered = filtered.filter(
          (p) => p.category?.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
      if (selectedHighlight) {
        if (selectedHighlight === 'featured') filtered = filtered.filter((p) => p.featured);
        else if (selectedHighlight === 'limited') filtered = filtered.filter((p) => p.isLimitedOffer || p.isSale);
        else if (selectedHighlight === 'sale') filtered = filtered.filter((p) => p.isSale);
        else if (selectedHighlight === 'new') filtered = filtered.filter((p) => p.isNew);
        else if (selectedHighlight === 'trending') filtered = filtered.filter((p) => p.isTrending);
        else if (selectedHighlight === 'premium') filtered = filtered.filter((p) => p.isPremium);
        else if (selectedHighlight === 'liveSpecial') filtered = filtered.filter((p) => p.isLiveSpecial);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.fabric.toLowerCase().includes(q)
        );
      }
      if (minPriceFilter > 0) {
        filtered = filtered.filter((p) => p.price >= minPriceFilter);
      }
      if (maxPriceFilter > 0) {
        filtered = filtered.filter((p) => p.price <= maxPriceFilter);
      }
      if (sortBy === 'price-asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }

      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / pageSize));
      const start = (page - 1) * pageSize;
      const paged = filtered.slice(start, start + pageSize);

      setProducts(paged);
      setTotalProducts(total);
      setTotalPages(pages);
      setProductsLoading(false);
    };
    void loadProducts();
  }, [page, selectedCategory, selectedSize, selectedHighlight, sortBy, searchQuery, minPriceFilter, maxPriceFilter, maxPrice]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setCategories(result.data as Category[]);
          return;
        }
      } catch {
        // ignore
      }
      if (Array.isArray(storeCategories) && storeCategories.length > 0) {
        setCategories(storeCategories as unknown as Category[]);
      } else {
        setCategories(initialCategories);
      }
    };



    fetchCategories();

  }, [storeCategories]);



  useEffect(() => {

    if (page > totalPages) setPage(totalPages);

  }, [page, totalPages]);



  useEffect(() => {
    if (!selectedCategory) {
      setAvailableSizes([]);
      setSelectedSize('');
      return;
    }

    const loadSizes = async () => {
      try {
        const params = new URLSearchParams({
          category: selectedCategory,
          limit: '48',
          page: '1',
        });
        const response = await fetch(`/api/products?${params.toString()}`);
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          const uniqueSizes = Array.from(
            new Set(
              (result.data as Product[])
                .filter((p) => p.sizes && p.sizes.length > 0)
                .flatMap((p) => p.sizes || [])
            )
          ).sort();
          setAvailableSizes(uniqueSizes);
        } else {
          setAvailableSizes([]);
        }
      } catch {
        setAvailableSizes([]);
      }
      setSelectedSize('');
    };

    void loadSizes();
  }, [selectedCategory]);

  const startIndex = totalProducts === 0 ? 0 : (page - 1) * pageSize;
  const endIndexExclusive = Math.min(startIndex + products.length, totalProducts);
  const pagedProducts = products;



  const handleSetPage = (nextPage: number) => {

    const clamped = Math.min(totalPages, Math.max(1, nextPage));

    setPage(clamped);

    if (typeof window !== 'undefined') {

      window.scrollTo({ top: 0, behavior: 'smooth' });

    }

  };



  const getPageItems = () => {

    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);



    const items: Array<number | 'ellipsis'> = [1];



    const left = Math.max(2, page - 1);

    const right = Math.min(totalPages - 1, page + 1);



    if (left > 2) items.push('ellipsis');

    for (let p = left; p <= right; p++) items.push(p);

    if (right < totalPages - 1) items.push('ellipsis');



    items.push(totalPages);

    return items;

  };



  return (

    <PublicLayout>

      <style>{`

        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}

        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}

        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}

        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}

        @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}

        @keyframes spinSlow{to{transform:rotate(360deg)}}

        @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}

        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}

        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}

        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}

        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}

        .product-card:hover{transform:translateY(-12px) scale(1.05) rotate-2;box-shadow:0 32px 64px hsl(var(--primary)/0.2)}

        .product-card{transition:transform 0.4s ease,box-shadow 0.4s ease}

        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}

        .spin-ring{animation:spinSlow 22s linear infinite}

      `}</style>



      <div className="min-h-screen relative overflow-hidden">

        {/* background gradient */}

        <div

          className="absolute inset-0 pointer-events-none"

          style={{

            background:

              'linear-gradient(160deg, hsl(var(--primary)/0.06) 0%, hsl(var(--background)) 50%, hsl(var(--secondary)/0.08) 100%)',

          }}

        />



        {/* floating orbs */}

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            width: 380, height: 380, top: -80, right: -100,

            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',

            animation: 'float1 10s ease-in-out infinite',

          }}

        />

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            width: 260, height: 260, bottom: 60, left: -80,

            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',

            animation: 'float2 8s ease-in-out infinite',

          }}

        />

        <div

          className="absolute rounded-full pointer-events-none"

          style={{

            width: 180, height: 180, top: '40%', left: '5%',

            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',

            animation: 'float3 9s ease-in-out infinite',

          }}

        />



        {/* ── BANNER ── */}
        <PageBanner
          title="Morpankh Saree · Products"
          heading="Our Collection"
          subtitle="Discover our exquisite collection of traditional and contemporary sarees crafted with love and precision."
        />

        {/* Mobile filter drawer - outside stacking contexts */}
        {filterOpen && (
          <div className="md:hidden fixed inset-0 z-[9999] bg-foreground/50">
            <div className="absolute right-0 top-0 h-full w-72 bg-card p-6 animate-slide-in-right overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-lg font-semibold">Filters</h3>
                <button onClick={() => setFilterOpen(false)}><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Category</p>
                <button onClick={() => { setSelectedCategory(''); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All</button>
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => { setSelectedCategory(cat.slug); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${selectedCategory === cat.slug ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{cat.name}</button>
                ))}
              </div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Price Range</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Minimum Price</label>
                    <input type="number" min="0" value={minPriceInput} onChange={(e) => setMinPriceInput(e.target.value)} placeholder="₹ Min" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Maximum Price</label>
                    <input type="number" min="0" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value)} placeholder="₹ Max" className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  {priceError && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive">{priceError}</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={handleApplyPriceFilter} className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium transition hover:bg-primary/90">Apply</button>
                    <button onClick={handleResetPrice} className="flex-1 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-xs font-medium transition hover:bg-muted/80">Reset</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Highlights</p>
                {highlightFilters.map((f) => (
                  <button key={f.key} onClick={() => { setSelectedHighlight(selectedHighlight === f.key ? '' : f.key); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${selectedHighlight === f.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{f.label}</button>
                ))}
              </div>
              {selectedCategory && availableSizes.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Size</p>
                  <div className="space-y-2">
                    <button onClick={() => { setSelectedSize(''); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${!selectedSize ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>All Sizes</button>
                    {availableSizes.map((size) => (
                      <button key={size} onClick={() => { setSelectedSize(size); setFilterOpen(false); }} className={`w-full text-left px-4 py-2 rounded-lg text-sm ${selectedSize === size ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{size}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DRAGGABLE CONTENT ── */}

        <div

          className="container mx-auto px-4 py-12 relative z-10"

        >

          {/* page pill + title */}

          {/* <div className="text-center mb-14 fade-up-1">

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">

              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />

              Product Explorer

            </div>

            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>

              {totalProducts} Products

            </h1>

          </div> */}



          <div className="flex flex-col gap-6 xl:flex-row xl:gap-8">

            <aside className={`w-[280px] shrink-0 transition-all duration-300 md:w-[300px] xl:w-[320px] ${sidebarOpen ? 'block' : 'hidden'}`}>

              <div className="filter-card rounded-2xl p-6 border border-border/60 shadow-xl backdrop-blur-xl fade-up-2" style={{ background: 'hsl(var(--card)/0.85)' }}>

                <div className="flex items-center justify-between mb-6">

                  <h2 className="text-lg font-semibold">Filters</h2>

                  <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-muted rounded-lg transition-colors" title="Hide Sidebar">

                    <ChevronLeft className="h-5 w-5" />

                  </button>

                </div>

                <div className="mb-6">

                  <div className="text-sm font-semibold mb-3">Price Range</div>

                  <div className="space-y-3">

                    <div>

                      <label className="text-xs text-muted-foreground mb-1 block">Minimum Price</label>

                      <input

                        type="number"

                        min="0"

                        value={minPriceInput}

                        onChange={(e) => setMinPriceInput(e.target.value)}

                        placeholder="₹ Min"

                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"

                      />

                    </div>

                    <div>

                      <label className="text-xs text-muted-foreground mb-1 block">Maximum Price</label>

                      <input

                        type="number"

                        min="0"

                        value={maxPriceInput}

                        onChange={(e) => setMaxPriceInput(e.target.value)}

                        placeholder="₹ Max"

                        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"

                      />

                    </div>

                    {priceError && (

                      <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">

                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />

                        <p className="text-xs text-destructive">{priceError}</p>

                      </div>

                    )}

                    <div className="flex gap-2">

                      <button

                        onClick={handleApplyPriceFilter}

                        className="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-xs font-medium transition hover:bg-primary/90"

                      >

                        Apply

                      </button>

                      <button

                        onClick={handleResetPrice}

                        className="flex-1 bg-muted text-muted-foreground px-3 py-2 rounded-lg text-xs font-medium transition hover:bg-muted/80"

                      >

                        Reset

                      </button>

                    </div>

                  </div>

                </div>



                <div className="mb-6">

                  <div className="text-sm font-semibold mb-3">Category</div>

                  <div className="space-y-2">

                    <button

                      onClick={() => setSelectedCategory('')}

                      className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}

                    >

                      All

                    </button>

                    {categories.map((cat) => (

                      <button

                        key={cat.id}

                        onClick={() => setSelectedCategory(cat.slug)}

                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.slug ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}

                      >

                        {cat.name}

                      </button>

                    ))}

                  </div>

                </div>



                <div className="mb-6">

                  <div className="text-sm font-semibold mb-3">Highlight</div>

                  <div className="space-y-2">

                    {highlightFilters.map((f) => (

                      <button

                        key={f.key}

                        onClick={() => setSelectedHighlight(selectedHighlight === f.key ? '' : f.key)}

                        className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${selectedHighlight === f.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}

                      >

                        {f.label}

                      </button>

                    ))}

                  </div>

                </div>



                {hasActiveFilters && (

                  <button onClick={clearFilters} className="text-xs text-destructive hover:underline">

                    Clear All

                  </button>

                )}

              </div>

            </aside>



            <div className="flex-1 min-w-0">

              {/* Search Bar and filters row */}

              <div className="mb-6 flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-center lg:gap-4 fade-up-4">
                <style jsx global>{`
                  .premium-filter-btn {
                    position: relative;
                    isolation: isolate;
                    overflow: hidden;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    min-height: 3rem;
                    width: auto;
                    min-width: 0;
                    flex-shrink: 0;
                    padding: 0.875rem 1.25rem;
                    border-radius: 9999px;
                    font-size: 0.95rem;
                    font-weight: 700;
                    letter-spacing: 0.3px;
                    color: #ffffff;
                    border: 1px solid rgba(255, 255, 255, 0.36);
                    background: linear-gradient(135deg, #0f766e, #16a34a);
                    box-shadow: 0 0 8px rgba(34, 197, 94, 0.25), 0 0 18px rgba(34, 197, 94, 0.2), 0 0 30px rgba(34, 197, 94, 0.14);
                    transition: all 0.35s ease;
                    transform: translateZ(0);
                    will-change: transform, box-shadow, filter;
                    cursor: pointer;
                  }

                  @media (min-width: 1024px) {
                    .premium-filter-btn {
                      width: 220px;
                      min-width: 220px;
                    }
                  }

                  .premium-filter-btn::before {
                    content: "";
                    position: absolute;
                    inset: -2px;
                    border-radius: inherit;
                    padding: 2px;
                    background: conic-gradient(from var(--angle, 0deg), rgba(255,255,255,0), rgba(255,255,255,0.95), rgba(34,197,94,0.8), rgba(255,255,255,0));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: premium-spin 3s linear infinite;
                    opacity: 0.95;
                    pointer-events: none;
                  }

                  .premium-filter-btn::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    border-radius: inherit;
                    background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 35%, transparent 70%);
                    transform: translateX(-140%);
                    animation: premium-sheen 4s linear infinite;
                    pointer-events: none;
                  }

                  .premium-filter-btn:hover {
                    transform: scale(1.04);
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.34), 0 0 24px rgba(34, 197, 94, 0.26), 0 0 38px rgba(34, 197, 94, 0.18);
                    filter: brightness(1.08);
                  }

                  .premium-filter-btn:focus-visible {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(255,255,255,0.35), 0 0 0 5px rgba(34,197,94,0.4);
                  }

                  .premium-filter-btn:active {
                    transform: scale(0.97);
                  }

                  .premium-filter-btn.is-active {
                    box-shadow: 0 0 10px rgba(34, 197, 94, 0.38), 0 0 24px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.2);
                    filter: brightness(1.1);
                    border-color: rgba(255,255,255,0.95);
                  }

                  @keyframes premium-spin {
                    to { --angle: 360deg; }
                  }

                  @keyframes premium-sheen {
                    0% { transform: translateX(-140%); }
                    100% { transform: translateX(140%); }
                  }

                  @property --angle {
                    syntax: "<angle>";
                    initial-value: 0deg;
                    inherits: false;
                  }
                `}</style>

                {!sidebarOpen && (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted md:w-auto md:h-12 lg:w-auto"
                  >
                    <ChevronRight className="h-4 w-4" /> Show Filters
                  </button>
                )}

                <div className="relative w-full flex-1 min-w-0 lg:w-auto">

                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  <input

                    type="text"

                    value={searchQuery}

                    onChange={(e) => setSearchQuery(e.target.value)}

                    placeholder="साडी शोधा..."

                    className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"

                  />

                </div>

                <div className="flex w-full flex-row gap-3 sm:gap-4 lg:w-auto lg:flex-row lg:gap-4">
                  <button
                    type="button"
                    aria-pressed={selectedHighlight === 'liveSpecial'}
                    onClick={() => setSelectedHighlight(selectedHighlight === 'liveSpecial' ? '' : 'liveSpecial')}
                    className={`premium-filter-btn flex-1 min-w-0 px-3 text-sm sm:px-4 lg:w-[220px] ${selectedHighlight === 'liveSpecial' ? 'is-active' : ''}`}
                  >
                    Live Special
                  </button>
                  <button
                    type="button"
                    aria-pressed={selectedHighlight === 'new'}
                    onClick={() => setSelectedHighlight(selectedHighlight === 'new' ? '' : 'new')}
                    className={`premium-filter-btn flex-1 min-w-0 px-3 text-sm sm:px-4 lg:w-[220px] ${selectedHighlight === 'new' ? 'is-active' : ''}`}
                  >
                    New Arrival
                  </button>
                </div>
              </div>

              <div className="mb-6 flex justify-end">
                {selectedCategory && availableSizes.length > 0 && (
                  <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="bg-card border border-border rounded-lg px-4 py-2 text-sm">
                    <option value="">Select Size</option>
                    {availableSizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                )}
              </div>






              {/* Grid */}

              {productsLoading ? (
                <div className="text-center py-20 text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading products...
                </div>
              ) : pagedProducts.length === 0 ? (

                <div className="text-center py-20 text-muted-foreground">No products found matching your filters.</div>

              ) : (

                <>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">

                    {pagedProducts.map((p, index) => (

                      <div key={`${p.id}-${index}`} className="product-card" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>

                        <ProductCard product={p} />

                      </div>

                    ))}

                  </div>



                  <div className="mt-10 flex flex-col items-center gap-4">

                    <div className="text-sm text-muted-foreground">

                      Showing {startIndex + 1} - {endIndexExclusive} of {totalProducts} products

                    </div>



                    {totalPages > 1 && (

                      <div className="flex items-center justify-center gap-2 flex-wrap">

                        <button

                          type="button"

                          onClick={() => {

                            if (page > 1) handleSetPage(page - 1);

                          }}

                          disabled={page <= 1}

                          className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"

                        >

                          Previous

                        </button>



                        {getPageItems().map((it, idx) => {

                          if (it === 'ellipsis') {

                            return (

                              <span key={`ellipsis-${idx === 1 ? 'start' : 'end'}`} className="px-2 text-muted-foreground">

                                ...

                              </span>

                            );

                          }



                          const isActive = it === page;

                          return (

                            <button

                              key={`page-${it}`}

                              type="button"

                              onClick={() => handleSetPage(it)}

                              className={`h-10 min-w-10 px-3 rounded-lg border text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted/50'}`}

                              aria-current={isActive ? 'page' : undefined}

                            >

                              {it}

                            </button>

                          );

                        })}



                        <button

                          type="button"

                          onClick={() => {

                            if (page < totalPages) handleSetPage(page + 1);

                          }}

                          disabled={page >= totalPages}

                          className="px-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/50"

                        >

                          Next

                        </button>

                      </div>

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



export default Products;

