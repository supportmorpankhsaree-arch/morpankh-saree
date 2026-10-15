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
      className="group block cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div ref={containerRef} className="bg-card rounded-xl overflow-hidden card-hover border border-border flex flex-col h-[285px]">
        <div className={`relative overflow-hidden transition-all duration-300 ease-in-out ${product.isLimitedOffer && !product.limitedOfferExpired && !product.isPrebooking && product.limitedOfferEndDate ? 'h-[155px]' : 'h-[210px]'}`}>
          {!imgLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          {isNearViewport && (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                quality={60}
                onLoadingComplete={() => setImgLoaded(true)}
                onError={() => {
                  setImageSrc('/placeholder.svg');
                  setImgLoaded(true);
                }}
                className={`object-cover object-center transition-transform duration-500 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
          )}
          <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2">
            {/* Prebooking badge */}
            {product.isPrebooking && (
              <PrebookingBadge 
                deliveryDays={product.prebookingDeliveryDays || 12} 
                className="max-w-[48%]"
              />
            )}
            
            {/* Sale/Discount badge */}
            {!product.isPrebooking && discount > 0 ? (
              <span className="bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm max-w-[48%] truncate">
                {product.isSale ? `${discount}% OFF` : `-${discount}%`}
              </span>
            ) : (
              !product.isPrebooking && <span />
            )}

            {/* LIMITED OFFER badge */}
            {product.isLimitedOffer && (
              <span className="bg-red-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                LIMITED
              </span>
            )}
          </div>
          {product.isNew && (
            <span className="absolute bottom-2 right-2 sm:bottom-2 sm:right-2 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-sm z-10">
              NEW
            </span>
          )}
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <button onClick={handleAddToCart} className="bg-card text-foreground p-3 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors" title="Add to Cart">
                <ShoppingCart className="h-5 w-5" />
              </button>

              <button onClick={handleToggleWishlist} className={`p-3 rounded-full transition-colors ${isWished ? 'bg-destructive text-destructive-foreground' : 'bg-card text-foreground hover:bg-destructive hover:text-destructive-foreground'}`} title="Wishlist">
                <Heart className="h-5 w-5" fill={isWished ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <MandatoryNoticeModal
            open={showBuyNowNotice}
            onOpenChange={setShowBuyNowNotice}
            onConfirm={confirmBuyNow}
          />
        </div>
        <div className="p-1.5 flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="w-full">
            <h3 className="font-medium text-foreground text-xs truncate">{product.name}</h3>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 mt-1">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-primary font-bold text-xs sm:text-sm">
                  Rs{product.isPrebooking ? (product.prebookingPrice || product.price) : product.price.toLocaleString()}
                </span>
                {product.comparePrice > product.price && (
                  <span className="text-muted-foreground text-[10px] sm:text-xs line-through shrink-0">Rs{product.comparePrice.toLocaleString()}</span>
                )}
              </div>
              <button
                onClick={handleBuyNow}
                className="bg-primary hover:bg-primary/95 text-white text-[10px] sm:text-[11px] font-bold px-1.5 py-1 sm:px-2 sm:py-1 rounded-md transition-all shadow-sm shrink-0 w-full sm:w-auto"
              >
                Buy Now
              </button>
            </div>

            {product.isLimitedOffer && stock > 0 && (
              <div className="text-[10px] sm:text-[11px] font-semibold text-[#EF4444] select-none mt-1">
                {stock > 5 ? (
                  <>🔥 Only <span className="font-bold">5 items available!</span> Order now</>
                ) : (
                  <>🔥 Only <span className="font-bold">{stock} item{stock > 1 ? 's' : ''} left!</span></>
                )}
              </div>
            )}

            {product.isLimitedOffer && !product.limitedOfferExpired && !product.isPrebooking && (
              <div className="mt-1 space-y-0.5">
                {product.limitedOfferMessage && (
                  <div className="text-[10px] text-orange-600 font-medium truncate">{product.limitedOfferMessage}</div>
                )}

                {product.limitedOfferEndDate && (
                  <div className="mt-1 w-full">
                    <LimitedOfferCountdown endDate={product.limitedOfferEndDate} compact={true} horizontal={true} />
                  </div>
                )}
              </div>
            )}
          </div>
          {product.isPrebooking && (
            <div className="mt-1.5 space-y-0.5 text-[10px] text-purple-700">
              <div className="flex items-center gap-1 font-medium text-purple-600">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                {product.prebookingMessage || 'Prebook now - Limited availability!'}
              </div>
              <div>
                Expected delivery: {product.prebookingDeliveryDays || 10}-{(product.prebookingDeliveryDays || 10) + 5} days
              </div>
            </div>
          )}
          {product.cardOfferText && !product.isPrebooking && (
            <div className="mt-1.5 flex justify-end">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                {product.cardOfferText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
