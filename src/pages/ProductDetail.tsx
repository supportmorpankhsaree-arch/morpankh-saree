'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';

import Link from 'next/link';

import { Heart, ShoppingCart, Minus, Plus, X } from 'lucide-react';

import Image from 'next/image';

import PublicLayout from '@/components/PublicLayout';

import ProductCard from '@/components/ProductCard';

import { useStore } from '@/store/useStore';

import { toast } from '@/hooks/use-toast';

import { Product, initialProducts } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import MandatoryNoticeModal from '@/components/MandatoryNoticeModal';
import { validateProductInquiryForm } from '@/lib/contactValidation';
import LimitedOfferSection from '@/components/LimitedOfferSection';
function mapDetailResponse(data: Record<string, unknown>): Product {
  const colors = (data.colors as Array<{ colorName: string; stock: number; images?: string[]; sizes?: Record<string, number>; hasSizes?: boolean }>) || [];
  const images = colors.flatMap((c) => c.images || []).filter(Boolean);
  const price = Number(data.basePrice ?? 0);
  const comparePrice = Number(data.compareAtPrice ?? price);

  return {
    id: String(data._id ?? ''),
    name: String(data.name ?? ''),
    slug: String(data.slug ?? ''),
    price,
    comparePrice,
    description: String(data.description ?? ''),
    fabric: String(data.fabricType ?? ''),
    images: images.length ? images : ['/placeholder.svg'],
    category: String(data.category ?? ''),
    colors: colors as Product['colors'],
    hasSizes: Boolean(data.hasSizes),
    sizes: Array.isArray(data.sizes) ? (data.sizes as string[]) : [],
    stock: colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0),
    sku: String(data.sku ?? ''),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    featured: Boolean(data.isFeatured),
    isNew: Boolean(data.isNew),
    isSale: Boolean(data.isSale),
    isPremium: Boolean(data.isPremium),
    isTrending: Boolean(data.isTrending),
    isLiveSpecial: Boolean(data.isLiveSpecial),
    isLimitedOffer: Boolean(data.isLimitedOffer),
    limitedStock: data.limitedStock ? Number(data.limitedStock) : undefined,
    limitedOfferMessage: data.limitedOfferMessage ? String(data.limitedOfferMessage) : undefined,
    limitedOfferEndDate: data.limitedOfferEndDate ? String(data.limitedOfferEndDate) : undefined,
    limitedOfferExpired: Boolean(data.limitedOfferExpired),
    isPrebooking: Boolean(data.isPrebooking),
    prebookingPrice: data.prebookingPrice ? Number(data.prebookingPrice) : undefined,
    prebookingDeliveryDays: data.prebookingDeliveryDays ? Number(data.prebookingDeliveryDays) : undefined,
    prebookingMessage: data.prebookingMessage ? String(data.prebookingMessage) : undefined,
    rating: Number(data.rating ?? 0),
    reviews: Number(data.reviewCount ?? 0),
  };
}

const ProductDetail = () => {

  const params = useParams<{ slug: string }>();

  const slug = params?.slug;

  const router = useRouter();

  const { addToCart, toggleWishlist, wishlist } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const loadProduct = async () => {
      setLoadingProduct(true);
      try {
        const res = await fetch(`/api/product/${slug}`);
        const data = await res.json();
        if (res.ok && !data?.error && data?._id) {
          const mapped = mapDetailResponse(data as Record<string, unknown>);
          setProduct(mapped);

          if (mapped.category) {
            const relatedRes = await fetch(
              `/api/products?category=${encodeURIComponent(mapped.category)}&limit=5`
            );
            const relatedJson = await relatedRes.json();
            if (relatedRes.ok && relatedJson?.success && Array.isArray(relatedJson.data) && relatedJson.data.length > 0) {
              setRelatedProducts(
                (relatedJson.data as Product[]).filter((p) => p.id !== mapped.id).slice(0, 4)
              );
              return;
            }
          }
          const rel = initialProducts.filter((p) => p.id !== mapped.id).slice(0, 4);
          setRelatedProducts(rel);
          return;
        }
      } catch {
        // ignore
      } finally {
        setLoadingProduct(false);
      }

      // No product found in database
      setProduct(null);
      setRelatedProducts([]);
      setLoadingProduct(false);
    };

    void loadProduct();
  }, [slug]);

  const [selectedColor, setSelectedColor] = useState('');

  useEffect(() => {
    if (product) {
      setInquiryForm((current) => ({
        ...current,
        productName: product.name,
        selectedColor: selectedColor || 'Default',
      }));
    }
  }, [product, selectedColor]);

  // Meta Pixel ViewContent event
  useEffect(() => {
    if (product && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'INR'
      });
    }
  }, [product]);

  const [selectedSize, setSelectedSize] = useState('');

  const [quantity, setQuantity] = useState(1);

  const [isBuyNowNoticeOpen, setIsBuyNowNoticeOpen] = useState(false);

  const executeBuyNow = () => {
    if (!product) return;
    const cart = useStore.getState().cart;
    const existing = cart.find((c) => c.productId === product.id && c.color === selectedColor && c.size === selectedSize);
    const alreadyInCart = existing ? existing.quantity : 0;
    const availableStock = currentVariantStock;

    if (alreadyInCart + quantity > availableStock) {
      toast({ title: `Only ${availableStock} quantity available for ${selectedColor}`, variant: 'destructive' });
      return;
    }

    let variantImage = product.images[0];
    if (product.colors && typeof product.colors[0] !== 'string') {
      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }> )
        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());
      if (colorVariant?.images && colorVariant.images.length > 0) {
        variantImage = colorVariant.images[0];
      }
    }

    const buyNowItem = {
      productId: product.id,
      name: product.name,
      image: variantImage,
      price: product.price,
      comparePrice: product.comparePrice,
      color: selectedColor,
      size: selectedSize,
      quantity,
      isPrebooking: product.isPrebooking,
      prebookingPrice: product.prebookingPrice,
      prebookingDeliveryDays: product.prebookingDeliveryDays,
    };

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('buyNowItem', JSON.stringify(buyNowItem));
      } catch (err) {
        console.warn('Failed to store buy now item', err);
      }
    }

    router.push('/checkout');
  };

  const handleOpenInquiry = () => {
    setInquiryForm({
      productName: product?.name || '',
      selectedColor: selectedColor || 'Default',
      phoneNumber: '',
      description: '',
    });
    setInquiryErrors({});
    setIsInquiryOpen(true);
  };

  const handleSubmitInquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateProductInquiryForm({
      ...inquiryForm,
      phoneNumber: inquiryForm.phoneNumber.trim(),
      description: inquiryForm.description.trim(),
    });

    if (!validation.isValid) {
      setInquiryErrors(validation.errors);
      return;
    }

    setInquiryErrors({});
    setIsInquirySubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product?.name || 'Product Inquiry',
          email: 'product-inquiry@local',
          message: 'Product inquiry submitted',
          mobileNumber: validation.normalizedValues.phoneNumber,
          productName: validation.normalizedValues.productName || product?.name || '',
          selectedColor: validation.normalizedValues.selectedColor || 'Default',
          phoneNumber: validation.normalizedValues.phoneNumber,
          description: validation.normalizedValues.description,
          messageType: 'Product Inquiry',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: data.error || 'Unable to submit inquiry', variant: 'destructive' });
        return;
      }

      toast({ title: 'Inquiry submitted', description: 'We will contact you soon.' });
      setIsInquiryOpen(false);
      setInquiryForm({
        productName: product?.name || '',
        selectedColor: selectedColor || 'Default',
        phoneNumber: '',
        description: '',
      });
    } catch {
      toast({ title: 'Unable to submit inquiry', variant: 'destructive' });
    } finally {
      setIsInquirySubmitting(false);
    }
  };

  const [selectedImage, setSelectedImage] = useState(0);

  const [mainImageSrc, setMainImageSrc] = useState(product?.images?.[0] || '/placeholder.svg');

  const [thumbErrors, setThumbErrors] = useState<Record<number, boolean>>({});

  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    productName: '',
    selectedColor: 'Default',
    phoneNumber: '',
    description: '',
  });
  const [inquiryErrors, setInquiryErrors] = useState<{ phoneNumber?: string; description?: string }>({});
  const [isInquirySubmitting, setIsInquirySubmitting] = useState(false);



  // Get images for selected color

  const getImagesForColor = useCallback((color: string) => {

    if (!product?.colors) return [];

    // Check if colors is array of strings or objects

    if (typeof product.colors[0] === 'string') {

      // Legacy format: colors are just strings, use main images

      return product.images || [];

    }

    // New format: colors have their own images

    const colorVariant = (product.colors as unknown as Array<{ colorName: string; colorImage?: string; image?: string; subImages?: string[]; images?: string[] }>).find((c) => c.colorName === color);

    const images = [colorVariant?.image, ...(colorVariant?.subImages || []), ...(colorVariant?.images || [])]
      .filter(Boolean)
      .filter((img, index, arr) => arr.indexOf(img) === index) as string[];

    return images.length > 0 ? images : product.images || [];

  }, [product]);



  const currentImages = useMemo(() => {

    if (!product) return [];

    // If no color selected, get the first available color's images

    const colorToUse = selectedColor || (

      product.colors?.[0] 

        ? (typeof product.colors[0] === 'string' ? product.colors[0] : product.colors[0].colorName)

        : ''

    );

    const images = getImagesForColor(colorToUse);

    console.log(`Color: ${colorToUse}, Images:`, images);

    return images;

  }, [product, selectedColor, getImagesForColor]);



  // Convert color names to hex values for display

  const getColorHex = useCallback((colorName: string) => {

    const colorMap: { [key: string]: string } = {

      'Red': '#DC2626',

      'Blue': '#2563EB',

      'Green': '#16A34A',

      'Yellow': '#CA8A04',

      'Orange': '#EA580C',

      'Purple': '#9333EA',

      'Pink': '#EC4899',

      'Navy': '#000080',

      'Teal': '#008080',

      'Cyan': '#00FFFF',

      'Magenta': '#FF00FF',

      'Lime': '#32CD32',

      'Olive': '#808000',

      'Gold': '#FFD700',

      'Silver': '#C0C0C0',

      'Indigo': '#4B0082',

      'Violet': '#EE82EE',

    };

    return colorMap[colorName] || '#6B7280'; // Default to gray if color not found

  }, []);



  const isWished = product ? wishlist.includes(product.id) : false;

  const discount = product ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 0;




  // Get stock for selected color variant

  const getVariantStock = useCallback((color: string, size?: string) => {

    if (!product?.colors) return product?.stock || 0;

    

    // Check if colors is array of strings or objects

    if (typeof product.colors[0] === 'string') {

      // Legacy format: use main product stock

      return product.stock || 0;

    }

    

    // New format: find variant stock

    const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number }; hasSizes?: boolean }>)

      .find((c) => c.colorName?.toLowerCase() === color.toLowerCase());

    // Use size-specific stock if size is provided and variant has sizes
    if (size && colorVariant?.hasSizes && colorVariant?.sizes) {
      return colorVariant.sizes[size] || 0;
    }

    return colorVariant?.stock || product.stock || 0;

  }, [product]);



  useEffect(() => {

    // Auto-select first available color on page load

    if (product && product.colors && product.colors.length > 0 && !selectedColor) {

      const colorVariants = product.colors.map((color) => {

        const colorName = typeof color === 'string' ? color : (color as unknown as { colorName: string }).colorName;

        const stock = getVariantStock(colorName);

        return { color: colorName, stock };

      });



      const firstAvailable = colorVariants.find(v => v.stock > 0) || colorVariants[0];

      setSelectedColor(firstAvailable.color);

      setQuantity(firstAvailable.stock > 0 ? 1 : 0);

    }

  }, [product, selectedColor, getVariantStock]);



  useEffect(() => {

    setSelectedImage(0); // Reset to first image when color changes

  }, [selectedColor]);



  useEffect(() => {

    const nextSrc = currentImages?.[selectedImage] || '/placeholder.svg';

    setMainImageSrc(nextSrc);

  }, [currentImages, selectedImage]);



  

  const currentVariantStock = useMemo(() => {

    if (!product?.colors) return product?.stock || 0;

    

    // Debug: Log product data and selected color

    if (product.name === 'Vintage Floral Grace') {

      console.log('🌸 FRONTEND STOCK DEBUG:', {

        productName: product.name,

        selectedColor,

        selectedSize,

        colors: product.colors,

        colorsType: typeof product.colors[0],

        allColorStocks: product.colors?.map(c => ({ 

          color: c.colorName, 

          stock: c.stock,

          stockType: typeof c.stock 

        }))

      });

    }

    

    // Check if colors is array of strings or objects

    if (typeof product.colors[0] === 'string') {

      // Legacy format: use main product stock

      return product.stock || 0;

    }

    

    // New format: find variant stock

    const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[]; sizes?: { [key: string]: number } }>)

      .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

    

    // For products with per-color size quantities
    // If size is selected, use size-specific stock
    // If no size selected, use total color stock (but require size selection before add to cart)
    if (colorVariant?.sizes) {
      if (selectedSize) {
        const sizeStock = colorVariant.sizes[selectedSize] || 0;
        
        // Debug: Log size-specific stock
        if (product.name === 'Vintage Floral Grace') {
          console.log('🎯 FRONTEND SIZE STOCK DEBUG:', {
            productName: product.name,
            selectedColor,
            selectedSize,
            sizeStock
          });
        }
        
        return sizeStock;
      }
      // No size selected - return total color stock for display
      return colorVariant.stock || product.stock || 0;
    }

    

    // Fix: Only use fallback if color variant is not found, not if stock is 0

    const stock = colorVariant !== undefined ? colorVariant.stock : (product.stock || 0);

    

    // Debug: Log found variant and stock

    if (product.name === 'Vintage Floral Grace') {

      console.log('🎯 FRONTEND VARIANT STOCK DEBUG:', {

        productName: product.name,

        selectedColor,

        foundVariant: colorVariant,

        finalStock: stock

      });

    }

    

    return stock;

  }, [product, selectedColor, selectedSize]);



  // Reset quantity to 1 when stock is 0, or to 1 when switching to a variant with stock

  useEffect(() => {

    if (currentVariantStock === 0) {

      setQuantity(0);

    } else if (quantity === 0) {

      setQuantity(1);

    }

  }, [currentVariantStock, quantity]);



  if (loadingProduct) return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading product...</div>
    </PublicLayout>
  );

  if (!product) return (

    <PublicLayout>

      <div className="container mx-auto px-4 py-20 text-center">

        <h1 className="text-2xl font-display font-bold">Product not found</h1>

      </div>

    </PublicLayout>

  );



  const handleAddToCart = () => {

    // Check cart for existing quantity

    const cart = useStore.getState().cart;

    const existing = cart.find((c) => c.productId === product.id && c.color === selectedColor && c.size === selectedSize);

    const alreadyInCart = existing ? existing.quantity : 0;

    const availableStock = currentVariantStock;



    if (alreadyInCart + quantity > availableStock) {

      toast({ title: `Only ${availableStock} quantity available for ${selectedColor}`, variant: 'destructive' });

      return;

    }



    // Get the correct variant image

    let variantImage = product.images[0]; // fallback to first image

    if (product.colors && typeof product.colors[0] !== 'string') {

      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }>)

        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

      if (colorVariant?.images && colorVariant.images.length > 0) {

        variantImage = colorVariant.images[0];

      }

    }



    addToCart({ productId: product.id, name: product.name, image: variantImage, price: product.price, color: selectedColor, size: selectedSize, quantity });

    toast({ title: 'Added to cart!', description: `${product.name} (${selectedColor})` });

    // Meta Pixel AddToCart event
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'INR'
      });
    }

  };



  const handleBuyNow = () => {

    // Check cart for existing quantity

    const cart = useStore.getState().cart;

    const existing = cart.find((c) => c.productId === product.id && c.color === selectedColor && c.size === selectedSize);

    const alreadyInCart = existing ? existing.quantity : 0;

    const availableStock = currentVariantStock;

    

    if (alreadyInCart + quantity > availableStock) {

      toast({ title: `Only ${availableStock} quantity available for ${selectedColor}`, variant: 'destructive' });

      return;

    }

    

    // Get correct variant image

    let variantImage = product.images[0]; // fallback to first image

    if (product.colors && typeof product.colors[0] !== 'string') {

      const colorVariant = (product.colors as Array<{ colorName: string; stock: number; images: string[] }>)

        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

      if (colorVariant?.images && colorVariant.images.length > 0) {

        variantImage = colorVariant.images[0];

      }

    }

    

    // Open the mandatory notice modal before proceeding to checkout
    setIsBuyNowNoticeOpen(true);
  };

  if (loadingProduct) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      </PublicLayout>
    );
  }

  if (!product) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested product could not be found.</p>
          <Link href="/products" className="btn-primary inline-block">
            Browse All Products
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (

    <PublicLayout>

      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* Images */}

          <div>

            <div className="aspect-[3/4] rounded-xl overflow-hidden mb-4">

              <div className="relative w-full h-full">

                <Image

                  src={mainImageSrc}

                  alt={product.name}

                  fill

                  priority

                  quality={75}

                  onError={() => setMainImageSrc('/placeholder.svg')}

                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 520px"

                  className="object-cover"

                />

              </div>

            </div>

            <div className="flex gap-3 flex-wrap">

              {currentImages.map((img, i) => (

                <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>

                  <div className="relative w-full h-full">

                    <Image

                      src={thumbErrors[i] ? '/placeholder.svg' : img}

                      alt=""

                      fill

                      quality={60}

                      onError={() => setThumbErrors((prev) => ({ ...prev, [i]: true }))}

                      sizes="80px"

                      className="object-cover"

                    />

                  </div>

                </button>

              ))}

            </div>

          </div>



          {/* Info */}

          <div>

            <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">

              <span className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</span>

              {product.comparePrice > product.price && (

                <>

                  <span className="text-lg text-muted-foreground line-through">₹{product.comparePrice.toLocaleString()}</span>

                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded">-{discount}%</span>

                </>

              )}

            </div>

            {/* Limited Offer Section */}
            <LimitedOfferSection product={product} compact={false} horizontal={true} />

            {/* Colors */}

            <div className="mt-6">

              <h3 className="text-sm font-medium mb-3">Color: {selectedColor}</h3>

              <div className="flex flex-wrap gap-3">

                {product?.colors?.map((color) => {

                  const colorName = typeof color === 'string' ? color : (color as unknown as { colorName: string }).colorName;
                  const colorVariant = typeof color === 'string'
                    ? undefined
                    : (color as unknown as { colorImage?: string; image?: string; images?: string[] });
                  const colorDisplayImage = colorVariant?.colorImage || colorVariant?.image || colorVariant?.images?.[0] || '';

                  const isSelected = selectedColor === colorName;

                  const stock = getVariantStock(colorName);

                  const isOutOfStock = stock === 0;

                  

                  const handleColorSelect = (color: string) => {

                    setSelectedColor(color);

                    // Reset selected size when changing color for products with sizes
                    const colorVariant = (product.colors as Array<{ colorName: string; sizes?: { [key: string]: number } }>)
                      .find((c) => c.colorName?.toLowerCase() === color.toLowerCase());

                    if (colorVariant?.sizes && Object.keys(colorVariant.sizes).length > 0) {
                      setSelectedSize('');
                      setQuantity(1); // Allow quantity selection, but require size before add to cart
                    } else {
                      const variantStock = getVariantStock(color);
                      setQuantity(variantStock > 0 ? 1 : 0);
                    }

                  };

                  

                  return (

                    <button 

                      key={colorName} 

                      onClick={() => !isOutOfStock && handleColorSelect(colorName)} 

                      disabled={isOutOfStock}

                      className={`w-12 h-12 rounded-full border-2 transition-all relative overflow-hidden ${

                        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'

                      } ${

                        isOutOfStock 

                          ? 'opacity-40 cursor-not-allowed grayscale' 

                          : 'hover:scale-110 cursor-pointer'

                      }`}

                      title={isOutOfStock ? `${colorName} - Out of Stock` : colorName}

                    >

                      <span className="sr-only">{colorName}</span>

                      {colorDisplayImage ? (
                        <Image
                          src={colorDisplayImage}
                          alt={colorName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: getColorHex(colorName),
                            backgroundImage: `linear-gradient(135deg, ${getColorHex(colorName)}dd, ${getColorHex(colorName)})`
                          }}
                        />
                      )}

                      {isOutOfStock && (

                        <span className="absolute inset-0 flex items-center justify-center">

                          <span className="text-[9px] font-bold text-white/80 bg-black/40 rounded-full px-0.5 leading-tight">

                            OUT

                          </span>

                        </span>

                      )}

                    </button>

                  );

                })}

              </div>

              {currentVariantStock === 0 && (

                <p className="text-red-500 font-semibold mt-2">

                  Out of Stock

                </p>

              )}

            </div>



            {/* Sizes */}

            {(product.sizes && product.sizes.length > 0) || (selectedColor && (product.colors as Array<{ colorName: string; sizes?: { [key: string]: number } }>)?.some(c => c.sizes && Object.keys(c.sizes).length > 0)) ? (

              <div className="mt-4">

                <h3 className="text-sm font-medium mb-3">Size</h3>

                <div className="flex gap-2">

                  {(() => {

                    // Get sizes from the selected color variant if available
                    if (selectedColor) {
                      const colorVariant = (product.colors as Array<{ colorName: string; sizes?: { [key: string]: number } }>)
                        .find((c) => c.colorName?.toLowerCase() === selectedColor.toLowerCase());

                      if (colorVariant?.sizes && Object.keys(colorVariant.sizes).length > 0) {
                        const availableSizes = Object.keys(colorVariant.sizes);

                        return availableSizes.map((size) => {
                          const sizeStock = colorVariant?.sizes?.[size] || 0;
                          const isOutOfStock = sizeStock === 0;

                          return (
                            <button
                              key={size}
                              onClick={() => !isOutOfStock && setSelectedSize(size)}
                              disabled={isOutOfStock}
                              className={`px-4 py-2 rounded-lg text-sm border-2 transition-colors ${
                                selectedSize === size ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                              } ${
                                isOutOfStock ? 'opacity-40 cursor-not-allowed grayscale' : ''
                              }`}
                              title={isOutOfStock ? `${size} - Out of Stock` : size}
                            >
                              {size}
                            </button>
                          );
                        });
                      }
                    }

                    // Fallback to product.sizes array for legacy products
                    return product.sizes?.map((size) => (
                      <button key={size} onClick={() => setSelectedSize(size)} className={`px-4 py-2 rounded-lg text-sm border-2 transition-colors ${selectedSize === size ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                        {size}
                      </button>
                    ));

                  })()}

                </div>

              </div>

            ) : null}



            {/* Quantity */}

            <div className="mt-6">

              <h3 className="text-sm font-medium mb-3">Quantity</h3>

              <div className="flex items-center gap-3">

                <button 

                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 

                  className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"

                  disabled={currentVariantStock === 0 || quantity <= 1}

                >

                  <Minus className="h-4 w-4" />

                </button>

                <span className="w-12 text-center font-medium">{quantity}</span>

                <button

                  onClick={() => {

                    if (quantity < currentVariantStock) {

                      setQuantity(quantity + 1);

                    } else {

                      toast({ title: `Only ${currentVariantStock} quantity available for ${selectedColor}`, variant: 'destructive' });

                    }

                  }}

                  className="p-2 border border-border rounded-lg hover:bg-muted transition-colors"

                  disabled={currentVariantStock === 0 || quantity >= currentVariantStock}

                >

                  <Plus className="h-4 w-4" />

                </button>

              </div>

              {currentVariantStock > 1 && quantity === currentVariantStock && (

                <div className="text-xs text-destructive mt-1">Max available quantity reached</div>

              )}

              

                          </div>



            {/* Buttons */}

            <div className="flex gap-3 mt-8">

              <button 

                onClick={handleAddToCart} 

                className={`btn-primary flex items-center gap-2 flex-1 ${

                  currentVariantStock === 0 ? "opacity-50 cursor-not-allowed" : ""

                }`}

                disabled={currentVariantStock === 0}

              >

                <ShoppingCart className="h-4 w-4" /> Add to Cart

              </button>

              <button 

                onClick={handleBuyNow} 

                className={`btn-secondary flex-1 ${

                  currentVariantStock === 0 ? "opacity-50 cursor-not-allowed" : ""

                }`}

                disabled={currentVariantStock === 0}

              >

                Buy Now

              </button>

              <button onClick={() => { toggleWishlist(product.id); toast({ title: isWished ? 'Removed' : 'Added to wishlist' }); }} className={`p-3 rounded-lg border-2 transition-colors ${isWished ? 'border-destructive text-destructive' : 'border-border hover:border-destructive hover:text-destructive'}`}>

                <Heart className="h-5 w-5" fill={isWished ? 'currentColor' : 'none'} />

              </button>

            </div>

            <MandatoryNoticeModal
              open={isBuyNowNoticeOpen}
              onOpenChange={setIsBuyNowNoticeOpen}
              onConfirm={executeBuyNow}
            />



            {/* Description */}

            <div className="mt-8 space-y-4">

              <div>

                <h3 className="font-display text-lg font-semibold mb-2">Fabric Details</h3>

                <p className="text-dark-grey text-sm">{product.fabric}</p>

              </div>

              <div className="mt-6">

                <h3 className="font-display text-lg font-semibold mb-2">Shipping Policy</h3>

                <ul className="space-y-2 list-none text-sm">
                  <li className="text-dark-grey">🚚 Delivery Within 3–10 Working Days.</li>
                  <li className="text-dark-grey">📍 Delivery time may vary as per location.</li>
                </ul>

              </div>

              <div>

                <h3 className="font-display text-lg font-semibold mb-2">Description</h3>

                <p className="text-dark-grey text-sm leading-relaxed whitespace-pre-line">{product.description}</p>

                <button 
                  type="button" 
                  onClick={handleOpenInquiry} 
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm rounded-lg border border-primary/30 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
                >
                  <span>Need help?</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </button>

                <img
                  src="/detail_img.png"
                  alt="Product detail illustration"
                  className="mt-4 w-full max-w-md rounded-lg border border-border object-cover shadow-sm"
                />

              </div>

            </div>

          </div>

        </div>



        {/* Related */}

        {relatedProducts.length > 0 && (

          <div className="mt-16">

            <h2 className="section-title mb-8">Related Products</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">

              {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}

            </div>

          </div>

        )}

      </div>

      <Dialog open={isInquiryOpen} onOpenChange={setIsInquiryOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Need Help?</DialogTitle>
            <DialogDescription>
              Share your query and we will help you with the product details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitInquiry} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Product Name</label>
                <Input value={inquiryForm.productName} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Selected Color</label>
                <Input value={inquiryForm.selectedColor} readOnly className="bg-muted/40" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  placeholder="फोन नंबर टाका"
                  value={inquiryForm.phoneNumber}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, '').slice(0, 10);
                    setInquiryForm((current) => ({ ...current, phoneNumber: digits }));
                    if (inquiryErrors.phoneNumber) {
                      setInquiryErrors((current) => ({ ...current, phoneNumber: undefined }));
                    }
                  }}
                  maxLength={10}
                />
                {inquiryErrors.phoneNumber ? <p className="text-sm text-destructive">{inquiryErrors.phoneNumber}</p> : null}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Description</label>
                  <span className="text-xs text-muted-foreground">{inquiryForm.description.length}/500</span>
                </div>
                <Textarea
                  placeholder="वर्णन/चौकशी"
                  rows={5}
                  maxLength={500}
                  value={inquiryForm.description}
                  onChange={(event) => {
                    setInquiryForm((current) => ({ ...current, description: event.target.value }));
                    if (inquiryErrors.description) {
                      setInquiryErrors((current) => ({ ...current, description: undefined }));
                    }
                  }}
                />
                {inquiryErrors.description ? <p className="text-sm text-destructive">{inquiryErrors.description}</p> : null}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setIsInquiryOpen(false)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button type="submit" disabled={isInquirySubmitting} className="btn-primary px-4 py-2 flex items-center justify-center gap-2">
                {isInquirySubmitting ? 'Submitting...' : 'Submit Inquiry'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </PublicLayout>

  );

};



export default ProductDetail;

