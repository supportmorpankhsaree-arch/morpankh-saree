import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Heart, User, Menu, X, LogOut, Send, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import logo from '@/assets/logo.png';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { Product } from '@/data/mockData';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Category', to: '/categories' },
  { label: 'Blog', to: '/blog' },
  { label: 'Gallery', to: '/gallery' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

let navbarRenderCount = 0;
let notificationFetchCount = 0;

const Navbar = () => {
  navbarRenderCount++;
  console.log(`[DEBUG] Navbar Render Count: ${navbarRenderCount}`);
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const cart = useStore((s) => s.cart);
  const wishlist = useStore((s) => s.wishlist);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const isAdmin = useStore((s) => s.isAdmin);
  const userName = useStore((s) => s.userName);
  const logout = useStore((s) => s.logout);
  const cartCount = cart.length;
  const [userMenu, setUserMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [announcement, setAnnouncement] = useState<{ text: string; enabled: boolean } | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        notificationFetchCount++;
        console.log(`[DEBUG] Notification (Announcement Bar) Fetch Count: ${notificationFetchCount}`);
        const res = await fetch('/api/announcement-bar', { cache: 'no-store' });
        const data = await res.json();
        if (!mounted) return;
        if (res.ok && data && typeof data.enabled === 'boolean' && typeof data.text === 'string') {
          setAnnouncement({ text: data.text, enabled: data.enabled });
        } else {
          setAnnouncement(null);
        }
      } catch {
        if (!mounted) return;
        setAnnouncement(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle Escape key to close sidebar and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Prevent body scroll when sidebar is open
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [mobileOpen, searchOpen]);

  // Fetch search suggestions
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`);
        const json = await res.json();
        if (res.ok && json?.success && Array.isArray(json.data)) {
          setSearchSuggestions(json.data as Product[]);
        } else {
          setSearchSuggestions([]);
        }
      } catch {
        setSearchSuggestions([]);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchOpen]);

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
    <div className="sticky top-0 z-50">
  {announcement?.enabled ? (
    <div className="bg-green-600 text-gray-200 overflow-hidden">
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          display: inline-flex;
          align-items: center;
          gap: 40px;
          white-space: nowrap;
          width: max-content;
          animation: marquee-scroll 100s linear infinite;
          will-change: transform;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="py-2">
        <div className="marquee-track">
          {Array.from({ length: 12 }).flatMap((_, i) => [
            <div key={`a-${i}`} className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Send className="h-4 w-4 shrink-0" />
              <span>{announcement.text}</span>
            </div>,
            <span key={`a-dot-${i}`} className="inline-block w-1 h-1 rounded-full bg-white/30 shrink-0" />,
          ])}
          {Array.from({ length: 12 }).flatMap((_, i) => [
            <div key={`b-${i}`} className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Send className="h-4 w-4 shrink-0" />
              <span>{announcement.text}</span>
            </div>,
            <span key={`b-dot-${i}`} className="inline-block w-1 h-1 rounded-full bg-white/30 shrink-0" />,
          ])}
        </div>
      </div>
    </div>
  ) : null}

      <style>{`
        @keyframes glass-aura-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          50% { transform: translate(35px, 6px) scale(1.15); opacity: 0.6; }
        }
        @keyframes glass-aura-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          50% { transform: translate(-30px, -6px) scale(1.1); opacity: 0.55; }
        }
        @keyframes nav-shimmer {
          0% { transform: translateX(-150%); }
          50%, 100% { transform: translateX(250%); }
        }
        @keyframes active-capsule-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .active-glass-capsule {
          background: linear-gradient(135deg, #059669 0%, #10b981 50%, #0d9488 100%);
          background-size: 200% 200%;
          animation: active-capsule-gradient 6s ease infinite;
          box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.5);
        }
        .nav-glass-sheen {
          position: relative;
          overflow: hidden;
        }
        .nav-glass-sheen::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
          pointer-events: none;
        }
        .nav-glass-sheen:hover::after {
          transform: translateX(100%);
        }
      `}</style>

      <nav className={`relative transition-all duration-300 border-b backdrop-blur-xl backdrop-saturate-150 py-2 sm:py-2.5 ${
        scrolled 
          ? 'bg-white/35 dark:bg-black/35 border-white/25 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]' 
          : 'bg-white/15 dark:bg-black/15 border-white/20 dark:border-white/10 shadow-[0_4px_20px_0_rgba(0,0,0,0.02)]'
      }`}>
        {/* Specular Glass Refraction Highlights */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 via-white/50 to-transparent pointer-events-none" />

        <div className="container mx-auto px-6 flex items-center justify-between h-18 sm:h-20 transition-all duration-300">
          <Link href="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-105 active:scale-95 py-0.5">
            <Image 
              src={logo} 
              alt="Morpankh Saree" 
              height={180} 
              width={280} 
              priority
              className="h-14 sm:h-16 md:h-18 max-h-[72px] w-auto object-contain filter drop-shadow-sm group-hover:drop-shadow-md transition-all duration-300"
            />
          </Link>

          {/* Desktop nav with Animated Text & Glassy Track */}
          <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-lg border border-white/30 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  href={link.to}
                  className={
                    active
                      ? 'relative text-sm font-bold text-white px-5 py-2 rounded-full active-glass-capsule nav-glass-sheen transition-all duration-300 flex items-center gap-2 group'
                      : 'relative text-sm font-medium text-slate-800 dark:text-slate-100 px-4 py-2 rounded-full hover:bg-white/35 hover:backdrop-blur-md transition-all duration-300 group border border-transparent hover:border-white/40 hover:shadow-[0_2px_12px_rgba(255,255,255,0.2)] nav-glass-sheen'
                  }
                >
                  {/* Animated Text */}
                  <span className={`relative z-10 transition-all duration-300 inline-block ${
                    active 
                      ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]' 
                      : 'group-hover:bg-gradient-to-r group-hover:from-emerald-700 group-hover:via-teal-600 group-hover:to-emerald-600 group-hover:bg-clip-text group-hover:text-transparent group-hover:scale-105 group-hover:tracking-wide font-medium group-hover:font-semibold'
                  }`}>
                    {link.label}
                  </span>

                  {/* Active Indicator & Pulse Dot */}
                  {active && (
                    <span className="relative flex h-2 w-2 z-10">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-300 shadow-[0_0_8px_#fde047]" />
                    </span>
                  )}

                  {/* Inactive Animated Underline Expansion */}
                  {!active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full transition-all duration-300 group-hover:w-3/5 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2.5">
          <div className="relative" ref={searchRef}>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="relative group p-2.5 text-slate-700 hover:text-emerald-700 transition-all duration-300 rounded-full bg-white/25 hover:bg-white/50 backdrop-blur-md border border-white/35 hover:border-emerald-300/60 shadow-xs hover:shadow-[0_4px_16px_rgba(16,185,129,0.18)] hover:scale-105 active:scale-95"
              aria-label="Search"
            >
              <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </button>
            
            {/* Search Dropdown */}
            {searchOpen && (
              <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] md:w-80 bg-white border border-gray-200 rounded-xl shadow-2xl z-[90] overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="साडी किंवा प्रकार शोधा..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                          router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary focus:shadow-lg outline-none placeholder:text-muted-foreground/70"
                      autoFocus
                    />
                  </div>
                </div>
                
                {/* Search Suggestions */}
                {searchSuggestions.length > 0 && (
                  <div className="max-h-80 overflow-y-auto">
                    <div className="p-2">
                      {searchSuggestions.map((product) => (
                        <Link
                          key={product.id}
                          href={`/product/${product.slug}`}
                          onClick={() => {
                            setSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <img
                            src={product.images?.[0] || ''}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">₹{product.price?.toLocaleString()}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          if (searchQuery.trim()) {
                            router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                            setSearchOpen(false);
                            setSearchQuery('');
                          }
                        }}
                        className="w-full text-center text-sm text-primary hover:text-primary/80 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View all results for "{searchQuery}"
                      </button>
                    </div>
                  </div>
                )}
                
                {searchQuery.length >= 2 && searchSuggestions.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No products found
                  </div>
                )}
              </div>
            )}
          </div>
          <Link href="/wishlist" className="relative group p-2.5 text-slate-700 hover:text-emerald-700 transition-all duration-300 rounded-full bg-white/25 hover:bg-white/50 backdrop-blur-md border border-white/35 hover:border-emerald-300/60 shadow-xs hover:shadow-[0_4px_16px_rgba(16,185,129,0.18)] hover:scale-105 active:scale-95">
            <Heart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-[0_2px_8px_rgba(239,68,68,0.5)] animate-pulse">
                {wishlist.length}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative group p-2.5 text-slate-700 hover:text-emerald-700 transition-all duration-300 rounded-full bg-white/25 hover:bg-white/50 backdrop-blur-md border border-white/35 hover:border-emerald-300/60 shadow-xs hover:shadow-[0_4px_16px_rgba(16,185,129,0.18)] hover:scale-105 active:scale-95">
            <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-[0_2px_8px_rgba(239,68,68,0.5)] animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User dropdown */}
          <div className="relative">
            <button onClick={() => setUserMenu(!userMenu)} className="relative group p-2.5 text-slate-700 hover:text-emerald-700 transition-all duration-300 rounded-full bg-white/25 hover:bg-white/50 backdrop-blur-md border border-white/35 hover:border-emerald-300/60 shadow-xs hover:shadow-[0_4px_16px_rgba(16,185,129,0.18)] hover:scale-105 active:scale-95">
              <User className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              {isLoggedIn && (
                <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white shadow-[0_0_6px_#10b981]" />
              )}
            </button>
            {userMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenu(false)} />
                <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] z-50 py-3 overflow-hidden">
                  <div className="absolute top-0 right-4 w-4 h-4 bg-white/95 border-l border-t border-white/80 transform rotate-45 -translate-y-2" />
                  {isLoggedIn ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                        <p className="text-sm font-semibold text-gray-800">{userName}</p>
                        <p className="text-xs text-gray-600">{isAdmin ? 'Admin' : 'Customer'}</p>
                      </div>
                      <Link href="/profile" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        My Profile
                      </Link>
                      <Link href="/orders" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        My Orders
                      </Link>
                      <Link href="/referral" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        My Referrals
                      </Link>
                      <Link href="/supercoins" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        Super Coins
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                          <span className="w-2 h-2 bg-gray-400 rounded-full" />
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          toast({ title: 'Logged out successfully' });
                          setUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        Customer Login
                      </Link>
                      <Link href="/register" onClick={() => setUserMenu(false)} className="px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors flex items-center gap-3">
                        <span className="w-2 h-2 bg-gray-400 rounded-full" />
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setMobileOpen(!mobileOpen)} 
            className="md:hidden p-2.5 text-slate-700 hover:text-emerald-700 transition-all duration-300 rounded-full bg-white/25 hover:bg-white/50 backdrop-blur-md border border-white/35 shadow-xs hover:scale-105 active:scale-95 touch-manipulation"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
        </div>
      </nav>
    </div>

    {/* Mobile sidebar overlay */}
    {mobileOpen && (
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden transition-opacity"
        onClick={() => setMobileOpen(false)}
      />
    )}

    {/* Mobile sidebar */}
    <div className={`fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-2xl border-r border-white/80 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out md:hidden ${
      mobileOpen ? 'translate-x-0' : '-translate-x-full'
    } overflow-y-auto`}>
      <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
          <div className="relative">
            <Image src={logo} alt="Morpankh Saree" height={50} width={50} />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-600 rounded-full" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">Morpankh</span>
        </Link>
        <button 
          onClick={() => setMobileOpen(false)} 
          className="p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-300 touch-manipulation"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex flex-col p-5 gap-2">
        {/* Mobile search */}
        <button
          onClick={() => {
            setSearchOpen(true);
            setMobileOpen(false);
          }}
          className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation"
        >
          <Search className="h-5 w-5" />
          Search Products
        </button>
        {navLinks.map((link) => (
          <Link
            key={link.to}
            href={link.to}
            onClick={() => setMobileOpen(false)}
            className={
              isActive(link.to)
                ? 'py-3 px-4 rounded-xl transition-all duration-300 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold shadow-md flex items-center gap-3 touch-manipulation'
                : 'py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation'
            }
          >
            {isActive(link.to) && (
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
            {!isActive(link.to) && (
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
            )}
            {link.label}
          </Link>
        ))}
        
        {/* Mobile user menu items */}
        <div className="border-t border-gray-200 pt-5 mt-3">
          {isLoggedIn ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg mb-3">
                <p className="text-sm font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-600">{isAdmin ? 'Admin' : 'Customer'}</p>
              </div>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                My Profile
              </Link>
              <Link href="/orders" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                My Orders
              </Link>
              <Link href="/referral" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                My Referrals
              </Link>
              <Link href="/supercoins" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Super Coins
              </Link>
              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                  <span className="w-2 h-2 bg-gray-400 rounded-full" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => {
                  logout();
                  toast({ title: 'Logged out successfully' });
                  setMobileOpen(false);
                }}
                className="w-full text-left py-3 px-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Customer Login
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="py-3 px-4 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-300 flex items-center gap-3 touch-manipulation">
                <span className="w-2 h-2 bg-gray-400 rounded-full" />
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default Navbar;
