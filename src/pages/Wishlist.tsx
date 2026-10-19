import Link from 'next/link';
import { Trash2, ShoppingCart, Heart, Sparkles } from 'lucide-react';
import PageBanner from '@/components/PageBanner';
import PublicLayout from '@/components/PublicLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const Wishlist = () => {
  const { products, wishlist, toggleWishlist, addToCart, loadProducts } = useStore();
  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  useEffect(() => {
    if (products.length === 0) {
      loadProducts(1, 100);
    }
  }, []);

  useEffect(() => {
    if (wishlist.length > 0 && products.length === 0) {
      loadProducts(1, 100);
    }
  }, [wishlist.length]);

  if (wishlistProducts.length === 0) {
    return (
      <PublicLayout>
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          {/* BANNER */}
          <PageBanner
            title="Morpankh Saree · Wishlist"
            heading="My Wishlist"
            subtitle="Your favorite items saved for later. Add them to cart when you're ready to purchase."
          />

          {/* DRAGGABLE CONTENT */}
          <div
            className="container mx-auto px-4 py-12 relative z-10"
          >
            {/* page pill + title */}
            <div className="text-center mb-14 fade-up-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Wishlist Management
              </div>
              <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
                
              </h1>
            </div>

            {/* EMPTY STATE */}
            <div className="max-w-2xl mx-auto text-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-primary/20 bg-primary/10">
                  <Heart className="w-16 h-16 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-primary">Your wishlist is empty</h2>
              <p className="text-dark-grey text-lg mb-8">Start adding your favorite sarees to your wishlist</p>
              <Link href="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg">
                <ShoppingCart className="w-5 h-5" />
                Browse Products
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* BANNER */}
        <PageBanner
          title="Morpankh Saree · Wishlist"
          heading="My Wishlist"
          subtitle="Your favorite items saved for later. Add them to cart when you're ready to purchase."
        />

        {/* DRAGGABLE CONTENT */}
        <div
          className="container mx-auto px-4 py-12 relative z-10"
        >
          {/* page pill + title */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Saved Favourites
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3 text-foreground">
              My Wishlist
            </h1>
            <p className="text-muted-foreground text-sm">
              {wishlistProducts.length} {wishlistProducts.length === 1 ? 'handcrafted piece' : 'handcrafted pieces'} saved in your private vault
            </p>
          </div>

          {/* WISHLIST GRID */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistProducts.map((product, index) => {
              const discount = product.comparePrice > product.price 
                ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) 
                : 0;

              return (
                <div
                  key={product.id}
                  className="group relative flex flex-col bg-card rounded-2xl overflow-hidden border border-border/70 hover:border-primary/50 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  {/* Full-bleed Luxury Image Container */}
                  <Link href={`/product/${product.slug}`} className="block relative aspect-[3/4] w-full overflow-hidden bg-muted/20">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-108"
                    />
                    {/* Subtle gradient to highlight bottom edge */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 opacity-60 group-hover:opacity-30 transition-opacity" />

                    {/* Top-Left Badges */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                      {discount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          {discount}% OFF
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-800 bg-amber-50/95 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300/50 shadow-xs backdrop-blur-xs">
                        👑 Authentic
                      </span>
                    </div>

                    {/* Top-Right Active Wishlist Heart */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product.id);
                        toast({ title: 'Removed from wishlist' });
                      }}
                      className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-all backdrop-blur-xs"
                      title="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    </button>
                  </Link>

                  {/* Card Content & Action Bar */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <Link href={`/product/${product.slug}`} className="block">
                        <h3 className="font-serif font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-2">
                          {product.name}
                        </h3>
                      </Link>

                      {/* Pricing Row */}
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-lg font-bold font-serif text-primary">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.comparePrice > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{product.comparePrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                      <button
                        onClick={() => {
                          addToCart({
                            productId: product.id,
                            name: product.name,
                            image: product.images[0],
                            price: product.price,
                            color: typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.colorName || '',
                            quantity: 1,
                          });
                          toast({ title: 'Added to bag', description: product.name });
                        }}
                        className="flex-1 py-2.5 px-3 bg-primary text-primary-foreground font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/95 transition-all shadow-sm hover:shadow-primary/20 active:scale-98 btn-shine"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Move to Cart
                      </button>

                      <button
                        onClick={() => {
                          toggleWishlist(product.id);
                          toast({ title: 'Removed from wishlist' });
                        }}
                        className="p-2.5 border border-border/80 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all active:scale-95"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
    </PublicLayout>
  );
};

export default Wishlist;
