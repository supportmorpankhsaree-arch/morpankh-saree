export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number;
  description: string;
  fabric: string;
  images: string[];
  category: string;
  colors?: string[] | Array<{ colorName: string; stock: number; images: string[] }>;
  hasSizes?: boolean;
  sizes?: string[];
  stock: number;
  sku: string;
  tags: string[];
  featured: boolean;
  isNew: boolean;
  isSale: boolean;
  isPremium: boolean;
  isTrending: boolean;
  isLiveSpecial?: boolean;
  rating: number;
  reviews: number;
  hidden?: boolean;
  salePercent?: number;
  isLimitedOffer?: boolean;
  limitedStock?: number;
  limitedOfferMessage?: string;
  limitedOfferEndDate?: string;
  limitedOfferExpired?: boolean;
  cardOfferText?: string;
  // Prebooking fields
  isPrebooking?: boolean;
  prebookingPrice?: number;
  prebookingDeliveryDays?: number;
  prebookingMessage?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: { 
    productId: string; 
    name: string; 
    image?: string; 
    color: string; 
    size?: string; 
    quantity: number; 
    price: number;
    isPrebooking?: boolean;
    prebookingDeliveryDays?: number;
  }[];
  subtotal: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  // Prebooking order fields
  isPrebookingOrder?: boolean;
  expectedDeliveryDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
}

export interface InventoryItem {
  productId: string;
  productName: string;
  variant: string;
  sku: string;
  stock: number;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
  avatar: string;
  approved: boolean;
}

export const sareeImages: string[] = [];

export const initialProducts: Product[] = [];

export const initialCategories: Category[] = [];

export const initialOrders: Order[] = [];

export const initialCustomers: Customer[] = [];

export const initialReviews: Review[] = [];

export interface Blog {
  _id: string;
  title: string;
  excerpt: string;
  description: string;
  image: string;
  status: string;
  slug: string;
  blogDate?: string;
  createdAt: Date;
}

export const initialBlogs: Blog[] = [];

export interface Career {
  _id: string;
  title: string;
  excerpt: string;
  description: string;
  image: string;
  status: string;
  slug: string;
  createdAt: Date;
}

export const initialCareers: Career[] = [];

export const getInventoryItems = (products: Product[]): InventoryItem[] => {
  return products.flatMap(p =>
    (p.colors || []).map((color, i) => {
      const colorName = typeof color === 'string' ? color : color.colorName;
      return {
        productId: p.id,
        productName: p.name,
        variant: colorName,
        sku: `${p.sku}-${colorName.substring(0, 3).toUpperCase()}`,
        stock: Math.max(0, p.stock - i * 3),
      };
    })
  );
};

