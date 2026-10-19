import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingCart, Package, Calendar, ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import PublicLayout from '@/components/PublicLayout';
import PageBanner from '@/components/PageBanner';
import { useStore } from '@/store/useStore';
import PrebookingBadge from '@/components/PrebookingBadge';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    fbq?: (event: string, eventName: string, parameters?: Record<string, unknown>) => void;
  }
}

const Cart = () => {
  const { cart, updateCartQuantity, removeFromCart, products } = useStore();
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasTrackedCartPixel = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq && cart.length > 0 && !hasTrackedCartPixel.current) {
      window.fbq('track', 'AddToCart', {
        value: subtotal,
        currency: 'INR'
      });
      hasTrackedCartPixel.current = true;
    }
  }, [cart.length, subtotal]);

  // Get stock for selected color variant
  const getVariantStock = (productId: string, color: string, size?: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return 0;
    
    // Check if colors is array of strings or objects
    if (!product.colors || typeof product.colors[0] === 'string') {
      // Legacy format: use main product stock
      return product.stock || 0;
    }
    
    // New format: find variant stock (case-insensitive to match orders API)
    const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)
      .find((c) => c.colorName?.toLowerCase() === color.toLowerCase());
    
    // Use size-specific stock if size is provided and variant has sizes
    if (size && colorVariant?.hasSizes && colorVariant?.sizes) {
      return colorVariant.sizes[size] || 0;
    }
    
    return colorVariant?.stock || product.stock || 0;
  };

  if (cart.length === 0) {
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
          @keyframes cartBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
          .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
          .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
          .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
          .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
          .cart-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px hsl(var(--primary)/0.12)}
          .cart-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
          .cart-bounce{animation:cartBounce 3s ease-in-out infinite}
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

          {/* BANNER */}
          <PageBanner
            title="Morpankh Saree · Shopping Cart"
            heading="Shopping Cart"
            subtitle="Your selected items are ready for checkout. Review and proceed to complete your order."
          />

          {/* DRAGGABLE CONTENT */}
          <div
            className="container mx-auto px-4 py-12 relative z-10"
          >
            {/* page pill + title */}
            <div className="text-center mb-14 fade-up-1">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium tracking-wide mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Cart Management
              </div>
              <h1 className="text-5xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>
                
              </h1>
            </div>

            {/* EMPTY STATE */}
            <div className="max-w-2xl mx-auto text-center fade-up-2">
              <div className="relative">
                <div className="w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-primary/20" style={{ background: 'hsl(var(--primary)/0.08)' }}>
                  <ShoppingCart className="w-16 h-16 cart-bounce" style={{ color: 'hsl(var(--primary))' }} />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'hsl(var(--primary))' }}>Your cart is empty</h2>
              <p className="text-dark-grey text-lg mb-8">Add some beautiful sarees to your cart and start shopping</p>
              <Link href="/products" className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium shadow-lg">
                <Package className="w-5 h-5" />
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
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-24px) scale(1.03)}}
        @keyframes float2{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(18px) scale(0.97)}}
        @keyframes float3{0%,100%{transform:translateX(0)}50%{transform:translateX(12px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bannerReveal{from{opacity:0;transform:scale(1.04)}to{opacity:1;transform:scale(1)}}
        @keyframes zoomPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes spinSlow{to{transform:rotate(360deg)}}
        @keyframes cartBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .banner-reveal{animation:bannerReveal 0.9s cubic-bezier(0.22,1,0.36,1) forwards}
        .fade-up-1{opacity:0;animation:fadeUp 0.6s ease 0.1s forwards}
        .fade-up-2{opacity:0;animation:fadeUp 0.6s ease 0.25s forwards}
        .fade-up-3{opacity:0;animation:fadeUp 0.6s ease 0.4s forwards}
        .cart-card:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 16px 40px hsl(var(--primary)/0.12)}
        .cart-card{transition:transform 0.3s ease,box-shadow 0.3s ease}
        .cart-bounce{animation:cartBounce 3s ease-in-out infinite}
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

        {/* BANNER */}
        <PageBanner
          title="Morpankh Saree · Shopping Cart"
          heading="Shopping Cart"
          subtitle="Your selected items are ready for checkout. Review and proceed to complete your order."
        />

        {/* DRAGGABLE CONTENT */}
        <div
          className="container mx-auto px-4 py-12 relative z-10"
        >
          {/* page pill + title */}
          <div className="text-center mb-12 fade-up-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold tracking-wide mb-4 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Morpankh Shopping Bag
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3 text-foreground">
              Review Your Cart
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              You have {cart.reduce((sum, item) => sum + item.quantity, 0)} handcrafted {cart.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'saree' : 'sarees'} waiting in your collection.
            </p>
          </div>

          {/* CART CONTENT */}
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 fade-up-2">
            {/* CART ITEMS */}
            <div className="lg:col-span-2 space-y-5">
              {cart.map((item, index) => {
                const availableStock = getVariantStock(item.productId, item.color, item.size);
                return (
                  <div 
                    key={`${item.productId}-${item.color}-${item.size || ''}`} 
                    className="cart-card rounded-2xl p-5 sm:p-6 bg-card border border-border/70 hover:border-primary/40 shadow-md hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                    style={{ 
                      animationDelay: `${0.2 + index * 0.08}s`,
                    }}
                  >
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Saree Thumbnail Frame */}
                      <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-xl overflow-hidden border border-border/60 bg-muted/30 shrink-0 shadow-sm">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500" 
                        />
                        {item.isPrebooking && (
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white shadow-xs">
                              Pre-order
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 w-full flex flex-col justify-between min-h-[140px]">
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-serif font-bold text-lg text-foreground line-clamp-1 hover:text-primary transition-colors">
                                {item.name}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-foreground border border-border/50">
                                  <span className="w-2 h-2 rounded-full bg-primary/70" />
                                  {item.color}
                                </span>
                                {item.size && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted/80 text-muted-foreground border border-border/50">
                                    Size: {item.size}
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3" /> In Stock ({availableStock})
                                </span>
                              </div>
                            </div>

                            {/* Remove button */}
                            <button 
                              onClick={() => removeFromCart(item.productId, item.color)} 
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-all"
                              title="Remove from bag"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          {item.isPrebooking && (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-200/50 mb-3 w-fit">
                              <Calendar className="h-3.5 w-3.5" />
                              Expected delivery: {item.prebookingDeliveryDays || 10}-{(item.prebookingDeliveryDays || 10) + 5} business days
                            </div>
                          )}
                        </div>

                        {/* Price & Quantity Bar */}
                        <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4 mt-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold font-serif text-primary">
                              ₹{(item.price * item.quantity).toLocaleString()}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-muted-foreground">
                                (₹{item.price.toLocaleString()} each)
                              </span>
                            )}
                          </div>

                          {/* Luxury Quantity Selector Capsule */}
                          <div className="inline-flex items-center bg-muted/60 rounded-xl p-1 border border-border/60 shadow-xs">
                            <button 
                              onClick={() => updateCartQuantity(item.productId, item.color, item.quantity - 1, item.size)} 
                              className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all active:scale-95 shadow-xs disabled:opacity-40"
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-10 text-center font-semibold text-sm text-foreground">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => {
                                if (item.quantity >= availableStock) {
                                  toast({ 
                                    title: `Only ${availableStock} quantity available for ${item.color}${item.size ? ` (${item.size})` : ''}`, 
                                    variant: 'destructive' 
                                  });
                                  return;
                                }
                                updateCartQuantity(item.productId, item.color, item.quantity + 1, item.size);
                              }} 
                              className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all active:scale-95 shadow-xs"
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="rounded-3xl p-6 sm:p-7 bg-card border border-border/80 shadow-xl backdrop-blur-xl relative overflow-hidden">
                {/* Decorative gold shimmer accent at top */}
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-primary via-amber-400 to-primary" />

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold text-foreground">Order Summary</h3>
                      <p className="text-xs text-muted-foreground">Prices inclusive of GST</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50">
                    Free Delivery
                  </span>
                </div>

                <div className="space-y-3.5 mb-6 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-foreground">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Delivery Charges</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Estimated Taxes</span>
                    <span className="text-xs font-medium text-muted-foreground">Included</span>
                  </div>
                </div>

                {/* Free Delivery Perk Banner */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 mb-6 flex items-center gap-2.5 text-xs text-primary">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>Eligible for Free Insured Express Delivery across India</span>
                </div>

                <div className="border-t border-border/70 pt-4 flex justify-between items-baseline mb-6">
                  <div>
                    <span className="text-base font-bold text-foreground block">Grand Total</span>
                    <span className="text-[11px] text-muted-foreground">All applicable discounts applied</span>
                  </div>
                  <span className="text-2xl font-serif font-bold text-primary">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>

                <Link 
                  href="/checkout" 
                  className="w-full relative overflow-hidden group flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/95 transition-all duration-300 font-semibold shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:translate-y-0 btn-shine"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Trust Badges */}
                <div className="mt-6 pt-5 border-t border-border/40 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground text-center">
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-muted/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>100% Authentic Silk</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-muted/40">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Encrypted Payment</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Cart;
