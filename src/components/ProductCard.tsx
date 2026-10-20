import { Heart, ShoppingCart, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Product } from '@/data/mockData';
import MandatoryNoticeModal from '@/components/MandatoryNoticeModal';
import { toast } from '@/hooks/use-toast';
import PrebookingBadge from '@/components/PrebookingBadge';
import LimitedOfferCountdown from '@/components/LimitedOfferCountdown';

interface ProductCardProps {
  product: Product;
}

let productCardRenderCount = 0;

const ProductCard = ({ product }: ProductCardProps) => {
  productCardRenderCount++;
  console.log(`[DEBUG] ProductCard (ID: ${product.id}) Render Count: ${productCardRenderCount}`);
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const isWished = wishlist.includes(product.id);
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : 0;

  const stock = product.stock ?? 0;

  const [imageSrc, setImageSrc] = useState(product.images[0] || '/placeholder.svg');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setImageSrc(product.images[0] || '/placeholder.svg');
    setImgLoaded(false);
  }, [product.id, product.images[0]]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsNearViewport(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setIsNearViewport(true);
          obs.disconnect();
        }
      },
      { root: null, rootMargin: '300px', threshold: 0.01 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check cart for existing quantity
    const cart = useStore.getState().cart;
    const color = typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.colorName || '';
    const existing = cart.find((c) => c.productId === product.id && c.color === color);
    const alreadyInCart = existing ? existing.quantity : 0;
    
    // Calculate available stock for variant
    let availableStock = product.stock || 0;
    if (product.colors && typeof product.colors[0] !== 'string') {
      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }>)
        .find((c) => c.colorName === color);
      availableStock = colorVariant?.stock || product.stock || 0;
    }
    
    if (alreadyInCart + 1 > availableStock) {
      toast({ title: `Only ${availableStock} quantity available for ${color}`, variant: 'destructive' });
      return;
    }
    addToCart({
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.isPrebooking ? (product.prebookingPrice || product.price) : product.price,
      comparePrice: product.comparePrice,
      color,
      quantity: 1,
      isPrebooking: product.isPrebooking,
      prebookingPrice: product.prebookingPrice,
      prebookingDeliveryDays: product.prebookingDeliveryDays,
    });
    toast({ 
      title: product.isPrebooking ? 'Prebooked successfully' : 'Added to cart', 
      description: product.name 
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
    toast({ title: isWished ? 'Removed from wishlist' : 'Added to wishlist', description: product.name });
  };

  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/product/${product.slug}`);
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(`/product/${product.slug}`);
    }
  };

  const [showBuyNowNotice, setShowBuyNowNotice] = useState(false);

  const confirmBuyNow = () => {
    const color = typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.colorName || '';
    const buyNowItem = {
      productId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.isPrebooking ? (product.prebookingPrice || product.price) : product.price,
      comparePrice: product.comparePrice,
      color,
      quantity: 1,
      isPrebooking: product.isPrebooking,
      prebookingPrice: product.prebookingPrice,
      prebookingDeliveryDays: product.prebookingDeliveryDays,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
      } catch (err) {
        console.warn('Failed to set buyNowItem in sessionStorage', err);
      }
    }

    toast({ title: product.isPrebooking ? 'Prebooked (Buy Now)' : 'Proceeding to checkout', description: product.name });
    router.push('/checkout');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const color = typeof product.colors?.[0] === 'string' ? product.colors?.[0] : product.colors?.[0]?.colorName || '';
    const cart = useStore.getState().cart;
    const existing = cart.find((c) => c.productId === product.id && c.color === color);
    const alreadyInCart = existing ? existing.quantity : 0;

    let availableStock = product.stock || 0;
    if (product.colors && typeof product.colors[0] !== 'string') {
      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }> )
        .find((c) => c.colorName === color);
      availableStock = colorVariant?.stock || product.stock || 0;
    }

    if (alreadyInCart + 1 > availableStock) {
      toast({ title: `Only ${availableStock} quantity available for ${color}`, variant: 'destructive' });
      return;
    }

    setShowBuyNowNotice(true);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      className="group block cursor-pointer h-full"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div ref={containerRef} className="bg-card rounded-xl overflow-hidden card-hover border border-border flex flex-col h-full shadow-sm hover:shadow-md transition-all duration-300">
        {/* 1:1 Square Image Container matching Flipkart card size */}
        <div className="relative w-full aspect-square overflow-hidden bg-slate-50 dark:bg-muted/40 transition-all duration-300 ease-in-out">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {isNearViewport && (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
              quality={85}
              onLoadingComplete={() => setImgLoaded(true)}
              onError={() => {
                setImageSrc('/placeholder.svg');
                setImgLoaded(true);
              }}
              className={`object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )}

          {/* Top-Right Heart Icon (Flipkart style direct overlay) */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full hover:scale-125 active:scale-90 transition-all duration-200 focus:outline-none"
            title={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ${
                isWished
                  ? 'fill-rose-500 text-rose-500 drop-shadow-md scale-110'
                  : 'fill-black/25 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] hover:fill-rose-500 hover:text-white'
              }`}
            />
          </button>

          {/* Top-Left Badges */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-start gap-1">
            {product.isPrebooking && (
              <PrebookingBadge 
                deliveryDays={product.prebookingDeliveryDays || 12} 
                className="max-w-[120px]"
              />
            )}
            {!product.isPrebooking && discount > 0 && (
              <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm transition-transform duration-300 group-hover:scale-105">
                {discount}% OFF
              </span>
            )}
            {product.isLimitedOffer && (
              <span className="animate-flame-pulse bg-red-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                🔥 LIMITED
              </span>
            )}
            {product.isNew && (
              <span className="bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                NEW
              </span>
            )}
          </div>

          {/* Bottom-Right Authentic Seal (Flipkart Authorised Seller Style) */}
          <div className="absolute bottom-2 right-2 z-10 pointer-events-none opacity-85 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-0.5 text-[8px] sm:text-[9px] font-bold text-amber-800 bg-amber-50/95 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-300/50 shadow-xs backdrop-blur-xs">
              👑 Authentic
            </span>
          </div>
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <MandatoryNoticeModal
            open={showBuyNowNotice}
            onOpenChange={setShowBuyNowNotice}
            onConfirm={confirmBuyNow}
          />
        </div>

        {/* Compact Details Section below Image */}
        <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1.5 bg-card">
          <div className="w-full">
            {/* Stock warning if applicable */}
            {product.isLimitedOffer && stock > 0 && stock <= 5 && (
              <div className="flex justify-end mb-1">
                <span className="text-[9px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded">
                  Only {stock} left
                </span>
              </div>
            )}

            {/* Product Title */}
            <h3 className="font-medium text-foreground text-xs sm:text-sm truncate group-hover:text-primary transition-colors" title={product.name}>
              {product.name}
            </h3>

            {/* Price Line (₹Price  ₹ComparePrice  Discount% off) */}
            <div className="flex items-baseline gap-1.5 mt-1.5 flex-wrap">
              <span className="font-bold text-sm sm:text-base text-foreground">
                ₹{product.isPrebooking ? (product.prebookingPrice || product.price).toLocaleString() : product.price.toLocaleString()}
              </span>
              {product.comparePrice > product.price && (
                <>
                  <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                    ₹{product.comparePrice.toLocaleString()}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-500">
                    {discount}% off
                  </span>
                </>
              )}
            </div>

            {/* Flipkart style Deal Pill / Tag (Lowest Price Live / Top Discount of the Sale) */}
            <div className="flex items-center justify-between gap-1.5 mt-1.5">
              {discount >= 50 ? (
                <span className="inline-block bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded truncate">
                  Top Discount of Sale
                </span>
              ) : product.isSale ? (
                <span className="inline-block bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded truncate">
                  Lowest Price Live
                </span>
              ) : product.isPrebooking ? (
                <span className="inline-block bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded truncate">
                  Prebooking Live
                </span>
              ) : (
                <span className="inline-block bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded truncate">
                  Festive Special
                </span>
              )}

              {/* Assured Badge (like f-Assured in Flipkart) */}
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50/90 dark:bg-blue-950/40 px-1 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 shrink-0">
                ⚡ Assured
              </span>
            </div>

            {/* Limited offer countdown if applicable */}
            {product.isLimitedOffer && !product.limitedOfferExpired && !product.isPrebooking && product.limitedOfferEndDate && (
              <div className="mt-1 w-full">
                <LimitedOfferCountdown endDate={product.limitedOfferEndDate} compact={true} horizontal={true} />
              </div>
            )}
          </div>

          {/* Action Row: Quick Add to Cart & Buy Now */}
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border/40">
            <button
              onClick={handleAddToCart}
              className="p-1.5 sm:p-2 rounded-lg border border-border hover:bg-muted text-foreground transition-all duration-200 hover:scale-105 active:scale-90 hover:border-primary shrink-0"
              title="Add to Cart"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={handleBuyNow}
              className="btn-shine flex-1 bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground text-xs font-bold py-1.5 px-2.5 rounded-lg transition-all shadow-xs hover:shadow-md hover:scale-[1.02] text-center"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
