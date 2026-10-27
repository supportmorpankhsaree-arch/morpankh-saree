import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Star, Plus, Send, X, ImagePlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLayout from '@/components/PublicLayout';
import ProductCard from '@/components/ProductCard';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { Category, Product, initialProducts, initialCategories, initialReviews } from '@/data/mockData';
import { uploadToR2 } from '@/lib/r2Upload';
import { normalizeReviewPayload } from '@/lib/reviewUtils';
import HomepagePopup from '@/components/HomepagePopup';
import type { FestiveBannerItem } from '@/components/admin/AdminFestiveBanners';

let indexRenderCount = 0;
let productListRenderCount = 0;

const defaultHomeProducts = {
  featured: initialProducts.filter((p) => p.featured),
  newArrivals: initialProducts.filter((p) => p.isNew),
  sale: initialProducts.filter((p) => p.isSale),
  premium: initialProducts.filter((p) => p.isPremium),
  trending: initialProducts.filter((p) => p.isTrending),
  limitedOffer: initialProducts.filter((p) => p.isLimitedOffer || p.isSale),
  liveSpecial: initialProducts.filter((p) => p.isLiveSpecial || p.featured),
};

const defaultApprovedReviews: ApprovedReviewItem[] = initialReviews.map((r) => ({
  _id: r.id,
  name: r.name,
  rating: r.rating,
  comment: r.comment,
  avatar: r.avatar,
  createdAt: r.date,
}));

const heroImages = [
  '/banner%201.png',
  '/banner%202.png',
  '/banner%203.png',
  '/banner%204.png',
];

const Section = ({
  title,
  subtitle,
  children,
}: {
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="py-5 md:py-8">
    <div className="container mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center"
      >
        <h2 className="section-title">{title}</h2>
        {/* Animated Brand Ornamental Flourish */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-primary/60" />
          <span className="w-1.5 h-1.5 rotate-45 bg-primary/70 rounded-[1px] animate-pulse" />
          <span className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-primary/60" />
        </div>
        {subtitle && <p className="section-subtitle mt-2">{subtitle}</p>}
      </motion.div>
      <div className="mt-5 md:mt-7">{children}</div>
    </div>
  </section>
);

const ProductSection = ({
  title,
  subtitle,
  items,
  filterParam,
  bg,
  titleClassName,
}: {
  title: React.ReactNode;
  subtitle: string;
  items: Product[];
  filterParam: string;
  bg?: string;
  titleClassName?: string;
}) => {
  productListRenderCount++;
  console.log(`[DEBUG] ProductList (ProductSection) Render Count: ${productListRenderCount}`);
  const show = items.slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className={`py-8 md:py-12 ${bg || ''}`}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="section-title">
            {typeof title === 'string' && titleClassName ? (
              <span className={titleClassName}>{title}</span>
            ) : (
              title
            )}
          </h2>
          {/* Animated Brand Ornamental Flourish */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-primary/60" />
            <span className="w-1.5 h-1.5 rotate-45 bg-primary/70 rounded-[1px] animate-pulse" />
            <span className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-primary/60" />
          </div>
          <p className="section-subtitle mt-2">{subtitle}</p>
        </motion.div>

        <div className="mt-6 md:mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {show.map((p, idx) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="h-full"
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mt-6 md:mt-8"
        >
          <Link
            href={`/products?highlight=${filterParam}`}
            className="btn-shine btn-outline-primary inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-xs hover:shadow-md"
          >
            View More <ChevronRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

type ApprovedReviewItem = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string;
  imageUrl?: string;
  createdAt: string | null;
};

const getCategoryBannerTheme = (cat: Category, index: number) => {
  const slug = (cat.slug || '').toLowerCase();
  const name = (cat.name || '').toLowerCase();

  if (slug.includes('silk') || name.includes('silk')) {
    return {
      gradient: 'from-[#250042] via-[#460975] to-[#71119e]',
      accentGlow: 'rgba(217, 70, 239, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: 'Royal Silk Sarees',
      price: 'Starts ₹3,499*',
      subtitle: 'Pure Banarasi & Kanjivaram',
      tagText: 'Pure Gold Zari',
      bankText: '10% Instant Discount*',
    };
  }
  if (slug.includes('paithani') || name.includes('paithani')) {
    return {
      gradient: 'from-[#3a042c] via-[#5e0a47] to-[#8d1369]',
      accentGlow: 'rgba(244, 63, 94, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: 'Yeola Paithani',
      price: 'Starts ₹8,999*',
      subtitle: 'Peacock Pallu & Heavy Zari',
      tagText: 'Authentic Handloom',
      bankText: 'Get 10% Savings* on Cards',
    };
  }
  if (slug.includes('cotton') || name.includes('cotton')) {
    return {
      gradient: 'from-[#032927] via-[#094d47] to-[#0e746a]',
      accentGlow: 'rgba(20, 184, 166, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: 'Cotton Handloom',
      price: 'From ₹1,499*',
      subtitle: 'Soft Weaves & Casual Grace',
      tagText: '100% Pure Cotton',
      bankText: 'Min 40% Off + 10% Bank Offer',
    };
  }
  if (slug.includes('georgette') || name.includes('georgette')) {
    return {
      gradient: 'from-[#1a0e38] via-[#3a1b75] to-[#6026b0]',
      accentGlow: 'rgba(168, 85, 247, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: 'Designer Georgette',
      price: 'Starts ₹2,499*',
      subtitle: 'Flowing Festive Silhouettes',
      tagText: 'Party & Festive Wear',
      bankText: '10% Instant Discount*',
    };
  }
  if (slug.includes('linen') || name.includes('linen')) {
    return {
      gradient: 'from-[#112348] via-[#1c3d78] to-[#295aa6]',
      accentGlow: 'rgba(59, 130, 246, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: 'Organic Linen Sarees',
      price: 'From ₹1,999*',
      subtitle: 'Breathable Pastel Handcraft',
      tagText: 'Artisan Crafted',
      bankText: 'Get 10% Savings* with Card',
    };
  }

  // Fallback cycled palettes
  const fallbacks = [
    {
      gradient: 'from-[#2b0845] via-[#4e1078] to-[#7919a3]',
      accentGlow: 'rgba(217, 70, 239, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: cat.name,
      price: 'Starts ₹2,999*',
      subtitle: 'Heritage Festive Collection',
      tagText: 'Special Edition',
      bankText: '10% Instant Discount*',
    },
    {
      gradient: 'from-[#3c0922] via-[#65123d] to-[#921d5a]',
      accentGlow: 'rgba(244, 63, 94, 0.45)',
      badgeTitle: 'THE BIG',
      badgeSub: 'FESTIVE DAYS',
      headline: cat.name,
      price: 'From ₹3,499*',
      subtitle: 'Curated Artisan Edition',
      tagText: 'Royal Trousseau',
      bankText: '10% Instant Savings*',
    },
  ];
  return fallbacks[index % fallbacks.length];
};

const Index = () => {
  indexRenderCount++;
  console.log(`[DEBUG] Home Page (Index) Render Count: ${indexRenderCount}`);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const userName = useStore((s) => s.userName);

  // ─── All state (declared once, in order) ──────────────────────────────────
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [homeProducts, setHomeProducts] = useState<{
    featured: Product[];
    newArrivals: Product[];
    sale: Product[];
    premium: Product[];
    trending: Product[];
    limitedOffer: Product[];
    liveSpecial: Product[];
  }>(defaultHomeProducts);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
  const [reviewImagePreview, setReviewImagePreview] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState<ApprovedReviewItem[]>(defaultApprovedReviews);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isReviewsPaused, setIsReviewsPaused] = useState(false);
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [categoryContainerRef, setCategoryContainerRef] = useState<HTMLDivElement | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupImageUrl, setPopupImageUrl] = useState<string | null>(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [festiveBanners, setFestiveBanners] = useState<FestiveBannerItem[]>([]);

  // ─── Fetch festive banner cards ──────────────────────────────────────────
  useEffect(() => {
    const fetchFestiveBanners = async () => {
      try {
        const response = await fetch('/api/festive-banners');
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data) && result.data.length > 0) {
          setFestiveBanners(result.data);
        }
      } catch {
        // fallback to categories
      }
    };
    void fetchFestiveBanners();
  }, []);

  // ─── Loading skeleton timer ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const res = await fetch('/api/products/home', { cache: 'no-store' });
        const json = await res.json();
        if (
          res.ok &&
          json?.success &&
          json.data &&
          Array.isArray(json.data.featured) &&
          Array.isArray(json.data.newArrivals) &&
          Array.isArray(json.data.sale) &&
          Array.isArray(json.data.premium) &&
          Array.isArray(json.data.trending) &&
          Array.isArray(json.data.limitedOffer) &&
          Array.isArray(json.data.liveSpecial)
        ) {
          setHomeProducts(json.data);
          return;
        }
      } catch {
        // ignore
      }
      setHomeProducts(defaultHomeProducts);
    };
    void loadHome();
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length <= 2) {
      setSearchResults([]);
      return;
    }
    const loadSearch = async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&limit=24`, { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setSearchResults(json.data as Product[]);
          return;
        }
      } catch {
        // ignore
      }
      // Fallback search across mock products
      const matches = initialProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
      setSearchResults(matches);
    };
    void loadSearch();
  }, [debouncedQuery]);

  // ─── Fetch approved reviews ────────────────────────────────────────────────
  useEffect(() => {
    const loadApprovedReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch('/api/reviews?approved=true');
        const data = await res.json();
        if (res.ok && Array.isArray(data.reviews)) {
          setApprovedReviews(data.reviews);
          return;
        }
      } catch {
        // ignore
      } finally {
        setReviewsLoading(false);
      }
      setApprovedReviews([]);
    };
    loadApprovedReviews();
  }, []);

  // ─── Fetch categories ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        if (response.ok && result?.success && Array.isArray(result.data)) {
          setCategories(result.data as Category[]);
          return;
        }
      } catch {
        // ignore
      }
      setCategories([]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const loadPopup = async () => {
      setPopupLoading(true);
      try {
        const res = await fetch('/api/homepage-popup');
        const json = await res.json();
        if (res.ok && json?.success && json.data?.imageUrl && json.data?.isActive !== false) {
          setPopupImageUrl(json.data.imageUrl);
          setPopupOpen(true);
        } else {
          setPopupImageUrl(null);
          setPopupOpen(false);
        }
      } catch {
        setPopupImageUrl(null);
        setPopupOpen(false);
      } finally {
        setPopupLoading(false);
      }
    };

    void loadPopup();
  }, []);

  // ─── Debounce search input (300ms) ────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Hero slider auto-slide ────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // ─── Slider navigation handlers ───────────────────────────────────────────
  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length);

  // ─── Category slider navigation handlers ───────────────────────────────────
  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoryContainerRef) return;
    const step = categoryContainerRef.clientWidth > 640 ? 490 : 340;
    const newPosition = direction === 'left' 
      ? Math.max(0, categoryContainerRef.scrollLeft - step) 
      : categoryContainerRef.scrollLeft + step;
    setCategoryScrollPosition(newPosition);
    categoryContainerRef.scrollTo({ left: newPosition, behavior: 'smooth' });
  };

  const handleCategoryScroll = () => {
    if (!categoryContainerRef) return;
    const step = categoryContainerRef.clientWidth > 640 ? 490 : 340;
    const newIndex = Math.round(categoryContainerRef.scrollLeft / step);
    setActiveCategoryIndex(newIndex);
  };

  const scrollToCategoryIndex = (index: number) => {
    if (!categoryContainerRef) return;
    const step = categoryContainerRef.clientWidth > 640 ? 490 : 340;
    categoryContainerRef.scrollTo({ left: index * step, behavior: 'smooth' });
    setActiveCategoryIndex(index);
  };

  const handleCategoryDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!categoryContainerRef) return;
    const startX = e.clientX;
    const scrollLeft = categoryContainerRef.scrollLeft;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - startX;
      categoryContainerRef.scrollLeft = scrollLeft - x;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setCategoryScrollPosition(categoryContainerRef.scrollLeft);
      handleCategoryScroll();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ─── Derived data (single source of truth: debouncedQuery) ───────────────
  const limitedOfferProducts = homeProducts.limitedOffer;
  const liveSpecialProducts = homeProducts.liveSpecial;
  const bestSellers = homeProducts.featured;
  const newArrivals = homeProducts.newArrivals;
  const saleProducts = homeProducts.sale;
  const premiumSarees = homeProducts.premium;
  const trendingSarees = homeProducts.trending;

  const isSearching = debouncedQuery.trim().length > 0;
  const isFullSearch = debouncedQuery.trim().length > 2;

  const filteredCategories = isSearching
    ? categories.filter((cat) =>
        cat.name.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
    : categories;

  const filteredProducts = isSearching ? searchResults : [];

  // ─── Review submit handler ────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    if (reviewSubmitting) return;
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setReviewSubmitting(true);
    try {
      let imageUrl = '';
      if (reviewImageFile) {
        imageUrl = await uploadToR2(reviewImageFile, { folder: 'reviews' });
      }

      const payload = normalizeReviewPayload({
        name: reviewForm.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        imageUrl,
      });

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Review submitted!', description: 'It will appear after admin approval.' });
        setReviewForm({ name: isLoggedIn ? userName : '', rating: 5, comment: '' });
        setReviewImageFile(null);
        setReviewImagePreview(null);
        setReviewModal(false);
      } else {
        toast({ title: data.error || 'Failed to submit review', variant: 'destructive' });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit review';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReviewImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please choose an image file', variant: 'destructive' });
      return;
    }

    setReviewImageFile(file);
    setReviewImagePreview(URL.createObjectURL(file));
  };

  const clearReviewImage = () => {
    if (reviewImagePreview) {
      URL.revokeObjectURL(reviewImagePreview);
    }
    setReviewImageFile(null);
    setReviewImagePreview(null);
  };

  const getReviewImageSrc = (imageUrl?: string) => {
    const trimmed = typeof imageUrl === 'string' ? imageUrl.trim() : '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : '';
  };

  const handleReviewCardImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.style.display = 'none';
  };

  // Subcomponents Section and ProductSection have been moved outside the component to prevent unnecessary unmounting/remounting

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-12">
          <div className="h-[400px] skeleton-loading mb-12 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={`skeleton-${i}`} className="space-y-3">
                <div className="aspect-[3/4] skeleton-loading rounded-xl" />
                <div className="h-4 skeleton-loading w-3/4" />
                <div className="h-4 skeleton-loading w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <PublicLayout>
      <HomepagePopup open={popupOpen} imageUrl={popupImageUrl} loading={popupLoading} onClose={() => setPopupOpen(false)} />

      {/* Hero Slider with Animated Transitions */}
      <section className="relative overflow-hidden bg-slate-950">
        <div className="relative w-full overflow-hidden select-none">
          <img
            src={heroImages[currentSlide]}
            alt="Morpankh Saree - Traditional Indian Sarees"
            className="w-full h-auto object-contain block select-none"
          />
          
          {/* Previous/Next Arrows with Hover Scale and Glassmorphism */}
          <button
            onClick={goToPrevious}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 z-10 border border-white/20 shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 rotate-180" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 z-10 border border-white/20 shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Dots Indicator with Spring Pill Animation */}
          <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/35 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 shadow-lg">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-white shadow-md' : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Full search results (>2 chars) OR homepage sections ── */}
      {isFullSearch ? (
        // ─── Search Results View ──────────────────────────────────────────────
        <section className="py-12 bg-muted/40 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">
                Results for &ldquo;{debouncedQuery}&rdquo;
              </h2>
              <button
                onClick={() => setSearchQuery('')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear ✕
              </button>
            </div>

            {filteredCategories.length > 0 && (
              <div className="mb-12">
                <h3 className="text-lg font-medium mb-4">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {filteredCategories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="px-4 py-2 bg-card border border-border rounded-full text-sm hover:bg-muted transition"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Products
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredProducts.length} found)
                  </span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No matching products found.</p>
            )}
          </div>
        </section>
      ) : (
        // ─── Normal Homepage Sections ─────────────────────────────────────────
        <>
          {/* Category Promotional Banners Slider (Festive Banner Cards) */}
          <Section 
            title={<span className="bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">Festive Category Specials</span>} 
            subtitle="Explore handcrafted sarees with exclusive festive offers & bank discounts"
          >
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No categories available.</p>
              </div>
            ) : (
              <div className="relative group">
                {/* Left Navigation Button */}
                <button
                  onClick={() => scrollCategories('left')}
                  className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-slate-800 p-2.5 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 hidden sm:flex items-center justify-center border border-slate-200/80 backdrop-blur-sm"
                  aria-label="Previous categories"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                </button>

                {/* Category Slider Container */}
                <div 
                  ref={setCategoryContainerRef}
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide py-2 px-1"
                  style={{ scrollBehavior: 'smooth' }}
                  onScroll={handleCategoryScroll}
                  onMouseDown={handleCategoryDragStart}
                >
                  <div className="flex gap-4 sm:gap-6">
                    {(festiveBanners.length > 0
                      ? (festiveBanners.length <= 2 ? [...festiveBanners, ...festiveBanners, ...festiveBanners] : [...festiveBanners, ...festiveBanners])
                      : [...categories, ...categories]
                    ).map((item, idx) => {
                      const isCustom = 'title' in item;
                      const theme = !isCustom ? getCategoryBannerTheme(item, idx) : null;
                      const cardKey = isCustom ? `${item.id || 'card'}-${idx}` : `${item.id}-${idx}`;
                      const link = isCustom ? (item.link || '/products') : `/products?category=${item.slug}`;
                      const gradient = isCustom ? (item.gradient || 'from-[#2b0845] via-[#4e1078] to-[#7919a3]') : theme!.gradient;
                      const accentGlow = isCustom ? 'rgba(217, 70, 239, 0.45)' : theme!.accentGlow;
                      const badgeTitle = isCustom ? (item.badgeTitle || 'THE BIG') : theme!.badgeTitle;
                      const badgeSub = isCustom ? (item.badgeSub || 'FESTIVE DAYS') : theme!.badgeSub;
                      const headline = isCustom ? item.title : theme!.headline;
                      const price = isCustom ? (item.price || 'Starts ₹2,999*') : theme!.price;
                      const subtitle = isCustom ? item.subtitle : theme!.subtitle;
                      const bankText = isCustom ? (item.bankOfferText || '10% Instant Discount*') : theme!.bankText;
                      const tagText = isCustom ? item.tagText : theme!.tagText;
                      const image = item.image;

                      return (
                        <Link
                          key={cardKey}
                          href={link}
                          className={`group/card flex-shrink-0 w-[330px] sm:w-[450px] md:w-[480px] h-[235px] sm:h-[255px] rounded-2xl sm:rounded-3xl p-4 sm:p-5 relative overflow-hidden bg-gradient-to-r ${gradient} shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/25 select-none flex cursor-pointer`}
                        >
                          {/* Festive Hanging Lights Garland SVG */}
                          <svg className="absolute top-0 left-0 w-full h-11 pointer-events-none opacity-90 z-0" viewBox="0 0 500 45" preserveAspectRatio="none">
                            <path d="M0,6 Q65,22 130,8 Q195,24 260,9 Q325,24 390,10 Q445,22 500,8" fill="none" stroke="#ffe082" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.65" />
                            <circle cx="40" cy="20" r="3" fill="#ffe082" />
                            <circle cx="40" cy="20" r="7" fill="#ffe082" opacity="0.3" />
                            <circle cx="100" cy="24" r="3.5" fill="#ffd54f" />
                            <circle cx="100" cy="24" r="8" fill="#ffd54f" opacity="0.35" />
                            <circle cx="165" cy="21" r="3" fill="#ffe082" />
                            <circle cx="165" cy="21" r="7" fill="#ffe082" opacity="0.3" />
                            <circle cx="230" cy="26" r="4" fill="#ffca28" />
                            <circle cx="230" cy="26" r="9" fill="#ffca28" opacity="0.4" />
                            <circle cx="295" cy="21" r="3" fill="#ffe082" />
                            <circle cx="295" cy="21" r="7" fill="#ffe082" opacity="0.3" />
                            <circle cx="360" cy="25" r="3.5" fill="#ffd54f" />
                            <circle cx="360" cy="25" r="8" fill="#ffd54f" opacity="0.35" />
                            <circle cx="430" cy="20" r="3" fill="#ffe082" />
                            <circle cx="430" cy="20" r="7" fill="#ffe082" opacity="0.3" />
                          </svg>

                          {/* Subtle Starry Sparkles in Background */}
                          <div className="absolute top-8 left-28 w-1 h-1 bg-yellow-200 rounded-full blur-[0.5px] opacity-75 animate-pulse" />
                          <div className="absolute top-14 left-44 w-1.5 h-1.5 bg-yellow-300 rounded-full blur-[0.5px] opacity-60" />
                          <div className="absolute top-6 right-36 w-1 h-1 bg-white rounded-full blur-[0.5px] opacity-80" />

                          {/* Top-Left Starburst Circular Badge (Tilted) */}
                          <div className="absolute top-2.5 left-3 sm:left-4 z-10 -rotate-6 group-hover/card:rotate-0 transition-transform duration-300">
                            <div className="relative flex flex-col items-center justify-center w-[54px] h-[54px] sm:w-[62px] sm:h-[62px] rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 shadow-lg border-2 border-dashed border-amber-700 text-center p-0.5 leading-none">
                              <span className="text-[8px] sm:text-[9px] uppercase tracking-tighter font-black text-blue-950 leading-none">
                                {badgeTitle}
                              </span>
                              <span className="text-[9px] sm:text-[10px] uppercase tracking-tight font-black text-rose-950 leading-tight mt-0.5">
                                {badgeSub}
                              </span>
                            </div>
                          </div>

                          {/* Top-Right Bank Offer Ribbon Pill */}
                          <div className="absolute top-2.5 right-28 sm:right-36 z-10">
                            <div className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-300 border border-amber-400/90 shadow-md flex flex-col items-center leading-none">
                              <span className="text-[8px] sm:text-[9px] font-black uppercase text-amber-950 tracking-wider">
                                BANK OFFER
                              </span>
                              <span className="text-[7px] sm:text-[8px] font-extrabold uppercase text-amber-900 tracking-tight">
                                REFRESHED
                              </span>
                            </div>
                          </div>

                          {/* Left Column Content */}
                          <div className="flex-1 flex flex-col justify-between pr-2 pt-12 sm:pt-14 pb-1 z-10">
                            <div>
                              <h3 className="text-white font-extrabold text-base sm:text-lg md:text-xl leading-snug drop-shadow line-clamp-1">
                                {headline}
                              </h3>
                              <div className="mt-1 flex items-baseline gap-1.5">
                                <span className="text-yellow-300 font-black text-lg sm:text-2xl tracking-tight drop-shadow-sm">
                                  {price}
                                </span>
                              </div>
                              {subtitle && (
                                <p className="text-white/90 text-xs sm:text-sm font-medium mt-0.5 line-clamp-1 drop-shadow-sm">
                                  {subtitle}
                                </p>
                              )}
                            </div>

                            {/* Bottom Bank Discount Bar matching Image 2 */}
                            {bankText && (
                              <div className="mt-2.5 bg-white/95 backdrop-blur-sm rounded-lg px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-md border border-white/60 max-w-[280px]">
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <span className="bg-[#8b1538] text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter">
                                    AXIS
                                  </span>
                                  <span className="bg-[#b33d00] text-white text-[8px] font-black px-1.5 py-0.5 rounded tracking-tighter">
                                    ICICI
                                  </span>
                                </div>
                                <span className="text-slate-900 text-[8px] sm:text-[9px] font-bold leading-tight truncate">
                                  {bankText}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Saree on Spotlight Pedestal */}
                          <div className="relative w-36 sm:w-44 h-full flex items-end justify-center z-10 flex-shrink-0 ml-1">
                            {/* Radial Glow Halo behind product */}
                            <div 
                              className="absolute bottom-6 w-28 h-28 sm:w-32 sm:h-32 rounded-full blur-xl pointer-events-none"
                              style={{ background: accentGlow }}
                            />

                            {/* 3D Circular Spotlight Platform */}
                            <div className="absolute bottom-1 w-32 sm:w-38 h-8 rounded-full bg-gradient-to-r from-amber-400/40 via-yellow-200/70 to-amber-500/40 border border-yellow-300/60 shadow-[0_4px_16px_rgba(255,215,0,0.4)]" />
                            <div className="absolute bottom-2.5 w-26 sm:w-32 h-5 rounded-full bg-gradient-to-r from-amber-300/60 via-white/80 to-amber-300/60 blur-[1px]" />

                            {/* Product Image on Pedestal */}
                            <div className="relative z-10 mb-2.5 w-28 sm:w-32 h-36 sm:h-44 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 border-white/40 transform transition-transform duration-500 group-hover/card:scale-105 group-hover/card:-translate-y-1">
                              {image ? (
                                <img
                                  src={image}
                                  alt={headline}
                                  className="w-full h-full object-cover object-top"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full bg-black/20 flex items-center justify-center text-white/50 text-xs">
                                  No Image
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" />
                              {tagText && (
                                <div className="absolute bottom-1.5 inset-x-1 text-center bg-black/60 backdrop-blur-md text-[8px] sm:text-[9px] text-yellow-300 font-bold px-1 py-0.5 rounded border border-yellow-400/30 truncate">
                                  {tagText}
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Right Navigation Button */}
                <button
                  onClick={() => scrollCategories('right')}
                  className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-slate-800 p-2.5 rounded-full shadow-2xl transition-all duration-200 hover:scale-110 hidden sm:flex items-center justify-center border border-slate-200/80 backdrop-blur-sm"
                  aria-label="Next categories"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* Centered Dots Pagination Indicator (Matching Image 2) */}
                <div className="flex items-center justify-center gap-1.5 mt-4">
                  {(festiveBanners.length > 0
                    ? (festiveBanners.length <= 2 ? [...festiveBanners, ...festiveBanners, ...festiveBanners] : [...festiveBanners, ...festiveBanners])
                    : [...categories, ...categories]
                  ).map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => scrollToCategoryIndex(dotIdx)}
                      className={`transition-all duration-300 rounded-full ${
                        activeCategoryIndex === dotIdx
                          ? 'w-6 h-2 bg-emerald-600 shadow-sm'
                          : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/60'
                      }`}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* Product Sections */}
          <ProductSection
            title="Limited Offer"
            titleClassName="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent"
            subtitle="Hurry up! Limited stock available"
            items={limitedOfferProducts}
            filterParam="limited"
            bg="bg-orange-50/40"
          />
          <ProductSection
            title="Live Special"
            titleClassName="bg-gradient-to-r from-purple-700 via-pink-600 to-rose-600 bg-clip-text text-transparent"
            subtitle="Exclusive live deals for you"
            items={liveSpecialProducts}
            filterParam="liveSpecial"
            bg="bg-purple-50/40"
          />
          <ProductSection
            title="Best Sellers"
            titleClassName="bg-gradient-to-r from-teal-900 via-emerald-700 to-teal-600 bg-clip-text text-transparent"
            subtitle="Our most loved sarees"
            items={bestSellers}
            filterParam="featured"
          />
          <ProductSection
            title="New Arrivals"
            titleClassName="bg-gradient-to-r from-emerald-800 via-teal-600 to-cyan-700 bg-clip-text text-transparent"
            subtitle="Fresh additions to our collection"
            items={newArrivals}
            filterParam="new"
          />
          <ProductSection
            title="Sale"
            titleClassName="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 bg-clip-text text-transparent"
            subtitle="Grab these deals before they're gone"
            items={saleProducts}
            filterParam="sale"
            bg="bg-muted"
          />
          <ProductSection
            title="Premium Sarees"
            titleClassName="bg-gradient-to-r from-purple-900 via-indigo-700 to-amber-600 bg-clip-text text-transparent"
            subtitle="Luxury craftsmanship for special occasions"
            items={premiumSarees}
            filterParam="premium"
          />
          <ProductSection
            title="Trending Sarees"
            titleClassName="bg-gradient-to-r from-teal-800 via-cyan-700 to-amber-600 bg-clip-text text-transparent"
            subtitle="What's popular right now"
            items={trendingSarees}
            filterParam="trending"
          />
        </>
      )}

      {/* Reviews — always visible */}
      <section className="py-8 md:py-12 bg-muted/60">
        <style>{`
          @keyframes reviewsMarqueeLTR {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0%); }
          }
        `}</style>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6"
          >
            <h2 className="section-title">
              <span className="bg-gradient-to-r from-teal-900 via-emerald-700 to-teal-800 bg-clip-text text-transparent">
                Customer Reviews
              </span>
            </h2>
            {/* Animated Brand Ornamental Flourish */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-primary/60" />
              <span className="w-1.5 h-1.5 rotate-45 bg-primary/70 rounded-[1px] animate-pulse" />
              <span className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-primary/60" />
            </div>
            <p className="section-subtitle mt-2">Real experiences from our cherished patrons</p>
          </motion.div>
          <div className="text-center mb-8">
            <button
              onClick={() => {
                setReviewForm({ name: isLoggedIn ? userName : '', rating: 5, comment: '' });
                setReviewImageFile(null);
                setReviewImagePreview(null);
                setReviewModal(true);
              }}
              className="btn-shine btn-outline-primary inline-flex items-center gap-2 text-sm py-2 px-5 hover:scale-105 active:scale-95 transition-all shadow-xs hover:shadow-md"
            >
              <Plus className="h-4 w-4" /> Add Review
            </button>
          </div>
          {reviewsLoading ? (
            <div className="text-center text-sm text-muted-foreground">Loading reviews...</div>
          ) : approvedReviews.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground">No reviews yet.</div>
          ) : (
            <div
              className="relative overflow-hidden edge-fade-mask py-3"
              onMouseEnter={() => setIsReviewsPaused(true)}
              onMouseLeave={() => setIsReviewsPaused(false)}
            >
              <div
                className="flex w-max gap-6"
                style={{
                  animation: `reviewsMarqueeLTR 70s linear infinite`,
                  animationPlayState: isReviewsPaused ? 'paused' : 'running'
                }}
              >
                {[...approvedReviews, ...approvedReviews].map((review, idx) => (
                  <div
                    key={`${review._id}-${idx}`}
                    className="bg-card rounded-xl p-6 card-hover border border-border flex-shrink-0 w-[280px]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                        {review.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{review.name}</p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={`star-${i}`}
                              className={`h-3 w-3 ${
                                i < review.rating ? 'text-gold fill-gold' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {getReviewImageSrc(review.imageUrl) ? (
                      <img
                        src={getReviewImageSrc(review.imageUrl)}
                        alt={`${review.name} review`}
                        loading="lazy"
                        onError={handleReviewCardImageError}
                        className="mt-3 h-36 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="mt-3 overflow-y-auto scrollbar-thin" style={{ maxHeight: "140px" }}>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <h3 className="font-display text-lg font-semibold mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: r })}
                    >
                      <Star
                        className={`h-6 w-6 cursor-pointer transition-colors ${
                          r <= reviewForm.rating ? 'text-gold fill-gold' : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comment</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  rows={3}
                  className="w-full border border-border rounded-lg px-4 py-2.5 bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Share your experience..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Photo (optional)</label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted">
                  <ImagePlus className="h-4 w-4" />
                  {reviewImageFile ? reviewImageFile.name : 'Choose an image'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleReviewImageChange} />
                </label>
                {reviewImagePreview ? (
                  <div className="mt-3 relative">
                    <img src={reviewImagePreview} alt="Review preview" className="h-32 w-full rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={clearReviewImage}
                      className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1 text-background"
                      aria-label="Remove review image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewModal(false)}
                  disabled={reviewSubmitting}
                  className="flex-1 btn-outline-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewSubmit}
                  disabled={reviewSubmitting}
                  className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {reviewSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA — always visible */}
      <section className="py-20 gradient-hero text-center relative overflow-hidden">
        {/* Animated background floating light rings */}
        <div className="absolute top-1/2 left-8 -translate-y-1/2 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute top-1/2 right-8 -translate-y-1/2 w-80 h-80 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none animate-float-slow" style={{ animationDelay: '-1.5s' }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-4 drop-shadow-md">
              Discover Your Perfect Saree
            </h2>
            <p className="text-primary-foreground/90 mb-8 max-w-xl mx-auto text-base sm:text-lg">
              Browse our complete collection of handcrafted sarees from across India
            </p>
            <Link
              href="/products"
              className="btn-shine inline-block bg-white text-slate-900 font-bold px-8 py-3.5 rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Browse All Products
            </Link>
          </motion.div>
        </div>
      </section>

    </PublicLayout>
  );
};

export default Index;