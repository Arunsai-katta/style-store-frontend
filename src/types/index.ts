export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin';
  avatar?: string;
  addresses: Address[];
  wishlist: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  shortDescription?: string;
  category: 't-shirts' | 'hoodies' | 'sweatshirts';
  subcategory?: string;
  originalPrice: number;
  sellingPrice: number;
  discountPercentage?: number;
  colorVariants: ColorVariant[];
  tags: string[];
  specifications: ProductSpecifications;
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  sku?: string;
  totalStock?: number;
  averageRating?: number;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface ColorVariant {
  _id: string;
  colorName: string;
  colorCode: string;
  images: string[];
  sizes: SizeVariant[];
  isActive: boolean;
}

export interface SizeVariant {
  _id: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
  quantity: number;
}

export interface ProductSpecifications {
  material?: string;
  fit?: 'Slim' | 'Regular' | 'Relaxed' | 'Oversized';
  careInstructions?: string[];
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Review {
  _id: string;
  product: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  order: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpful: {
    count: number;
    users: string[];
  };
  isActive: boolean;
  adminResponse?: {
    comment: string;
    respondedAt: string;
    respondedBy: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  totals: {
    subtotal: number;
    discount: number;
    total: number;
    totalItems: number;
    itemCount: number;
  };
}

export interface CartItem {
  _id: string;
  product: Product;
  colorVariantId: string;
  colorName: string;
  colorCode: string;
  image: string;
  size: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  payment: PaymentDetails;
  shipping: ShippingDetails;
  pricing: OrderPricing;
  status: OrderStatus;
  timeline: TimelineEvent[];
  notes?: {
    customer?: string;
    internal?: string;
  };
  returnEligibleUntil?: string;
  isReturnEligible: boolean;
  couponCode?: string;
  couponDiscount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id: string;
  product: string;
  name: string;
  colorVariant: {
    colorName: string;
    colorCode: string;
    image: string;
  };
  size: string;
  quantity: number;
  originalPrice: number;
  sellingPrice: number;
  totalPrice: number;
}

export interface PaymentDetails {
  method: 'cod' | 'razorpay' | 'wallet';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partially_refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount: number;
  refundReason?: string;
}

export interface ShippingDetails {
  provider: string;
  shipmentId?: string;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  status: ShippingStatus;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  shippingCost: number;
}

export interface OrderPricing {
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export interface TimelineEvent {
  _id: string;
  status: string;
  description: string;
  timestamp: string;
  isPublic: boolean;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'return_requested' 
  | 'returned' 
  | 'refunded';

export type ShippingStatus = 
  | 'pending' 
  | 'label_generated' 
  | 'picked_up' 
  | 'in_transit' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled' 
  | 'returned';

export interface Return {
  _id: string;
  returnNumber: string;
  order: string;
  user: string;
  items: ReturnItem[];
  refundDetails: RefundDetails;
  status: ReturnStatus;
  pickupDetails: PickupDetails;
  inspectionDetails?: InspectionDetails;
  adminNotes?: string;
  rejectionReason?: string;
  timeline: TimelineEvent[];
  requestedAt: string;
  completedAt?: string;
}

export interface ReturnItem {
  _id: string;
  orderItem: string;
  product: string;
  name: string;
  colorName: string;
  size: string;
  quantity: number;
  reason: ReturnReason;
  reasonDescription?: string;
  images?: string[];
  refundAmount: number;
}

export interface RefundDetails {
  totalAmount: number;
  method: 'original_payment' | 'store_credit' | 'bank_transfer';
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    bankName: string;
  };
  processedAt?: string;
  transactionId?: string;
}

export interface PickupDetails {
  scheduledDate?: string;
  courierName?: string;
  trackingNumber?: string;
  pickedUpAt?: string;
}

export interface InspectionDetails {
  inspectedBy?: string;
  inspectedAt?: string;
  condition?: 'excellent' | 'good' | 'fair' | 'damaged' | 'not_returnable';
  notes?: string;
  images?: string[];
}

export type ReturnStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'pickup_scheduled' 
  | 'picked_up' 
  | 'received' 
  | 'inspected' 
  | 'refund_initiated' 
  | 'refunded' 
  | 'cancelled';

export type ReturnReason = 
  | 'defective' 
  | 'wrong_item' 
  | 'not_as_described' 
  | 'size_issue' 
  | 'changed_mind' 
  | 'other';

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  returnRequests: number;
  lowStockCount: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  count: number;
  total: number;
  pagination: PaginationInfo;
  data: T;
}
