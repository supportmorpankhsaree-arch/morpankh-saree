export type ProductColorImageVariant = {
  colorName?: string;
  stock?: number;
  image?: string;
  images?: string[];
  colorImage?: string;
  subImages?: string[];
  hasSizes?: boolean;
  sizes?: Record<string, number>;
};

export function getColorImageGallery(variant: ProductColorImageVariant | null | undefined): string[] {
  const primaryImage = variant?.image || variant?.colorImage || variant?.images?.[0] || '';
  const subImages = Array.isArray(variant?.subImages) ? variant.subImages.filter(Boolean) : [];
  const fallbackImages = Array.isArray(variant?.images) ? variant.images.filter(Boolean) : [];

  const uniqueImages = [primaryImage, ...subImages, ...fallbackImages.filter((img) => img !== primaryImage && !subImages.includes(img))]
    .filter(Boolean)
    .filter((img, index, arr) => arr.indexOf(img) === index);

  return uniqueImages;
}

export function getColorDisplayImage(variant: ProductColorImageVariant | null | undefined): string {
  return variant?.colorImage || variant?.image || variant?.images?.[0] || '';
}

export function buildColorVariantPayload(variant: ProductColorImageVariant & { colorName: string; stock?: number }) {
  const normalizedSubImages = Array.isArray(variant.subImages)
    ? variant.subImages.filter((img): img is string => typeof img === 'string' && Boolean(img.trim()))
    : [];

  const primaryImage = variant.image || variant.colorImage || variant.images?.[0] || '';

  return {
    colorName: variant.colorName,
    stock: Number(variant.stock) || 0,
    colorImage: variant.colorImage || '',
    image: primaryImage,
    subImages: normalizedSubImages.slice(0, 2),
  };
}
