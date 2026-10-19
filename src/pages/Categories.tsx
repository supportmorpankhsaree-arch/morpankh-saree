import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { Category, initialCategories } from '@/data/mockData';
import { Loader2, ShoppingBag, Search, Sparkles, ArrowRight } from 'lucide-react';
import PageBanner from '@/components/PageBanner';

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const name = String(c.name || '').toLowerCase();
      const slug = String(c.slug || '').toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [categories, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('/api/categories', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.data)) {
        setCategories(result.data);
        return;
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    setCategories(initialCategories);
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
        .category-card:hover{transform:translateY(-8px) scale(1.02);box-shadow:0 24px 48px hsl(var(--primary)/0.25)}
        .category-card{transition:transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),box-shadow 0.4s ease}
        .logo-pulse{animation:zoomPulse 4s ease-in-out infinite}
        .spin-ring{animation:spinSlow 22s linear infinite}
        .categories-container:hover .floating-orb{animation-play-state:paused}
        .categories-container:hover .banner-shape{animation-play-state:paused}
      `}</style>

      <div className="min-h-screen relative overflow-hidden categories-container">
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
          className="absolute rounded-full pointer-events-none floating-orb"
          style={{
            width: 380, height: 380, top: -80, right: -100,
            background: 'radial-gradient(circle, hsl(var(--primary)/0.12), transparent 70%)',
            animation: 'float1 10s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none floating-orb"
          style={{
            width: 260, height: 260, bottom: 60, left: -80,
            background: 'radial-gradient(circle, hsl(var(--secondary)/0.10), transparent 70%)',
            animation: 'float2 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none floating-orb"
          style={{
            width: 180, height: 180, top: '40%', left: '5%',
            background: 'radial-gradient(circle, hsl(var(--primary)/0.07), transparent 70%)',
            animation: 'float3 9s ease-in-out infinite',
          }}
        />

        {/* ── BANNER ── */}
        <PageBanner
          title="Morpankh Saree · Categories"
          heading="Categories"
          subtitle="Explore our curated collection of traditional and contemporary sarees across different categories."
        />

        {/* ── DRAGGABLE CONTENT ── */}
        <div
          className="container mx-auto px-4 py-12 relative z-10"
        >
          {/* page pill + title */}
          <div className="text-center mb-14 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Category Explorer
            </div>
            <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
              
            </h1>
          </div>

          {/* CATEGORIES CONTENT */}
          <div className="max-w-6xl mx-auto mb-10 fade-up-2">
            {/* Search Bar */}
            <div className="relative max-w-lg mx-auto mb-8 fade-up-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="साडीचा प्रकार शोधा..."
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">No categories found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCategories.map((cat, index) => (
                <Link
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className="category-card group relative aspect-[3/4] rounded-3xl overflow-hidden border border-border/70 hover:border-primary/60 shadow-xl backdrop-blur-xl bg-card"
                  style={{
                    animationDelay: `${0.4 + index * 0.1}s`,
                  }}
                >
                  <div className="relative w-full h-full">
                    {/* Background Saree Image */}
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                    />

                    {/* Gradient scrim for perfect clarity in center and text readability at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10 transition-opacity duration-300 group-hover:from-black/90" />

                    {/* Top Floating Glass Badges */}
                    <div className="absolute top-4 left-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/90 text-white shadow-md backdrop-blur-md border border-white/20">
                        <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                        Exclusive
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 z-10">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white shadow-md backdrop-blur-md border border-white/10">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        {cat.productCount} Sarees
                      </span>
                    </div>

                    {/* Bottom Content Area */}
                    <div className="absolute inset-x-0 bottom-0 p-6 z-10 flex flex-col justify-end">
                      <div className="mb-2">
                        <h3 className="text-white font-serif font-bold text-2xl tracking-wide group-hover:text-amber-200 transition-colors drop-shadow-sm">
                          {cat.name}
                        </h3>
                        <div className="h-0.5 w-10 bg-gradient-to-r from-amber-400 to-amber-200/40 rounded-full mt-2 group-hover:w-20 transition-all duration-300" />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-white/80 text-xs font-medium tracking-wider uppercase">
                          Handcrafted Weaves
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 group-hover:bg-primary group-hover:border-primary transition-all">
                          Explore
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Categories;
