// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  verified: boolean;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accountType: 'client' | 'vendor';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  role: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  description: string;
  dailyPrice: number;
  category: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  discountPercent?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  userId: number;
  username: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ProductReviewSummary {
  productId: number;
  averageRating: number;
  reviewCount: number;
}

export interface ProductRequest {
  name: string;
  description: string;
  dailyPrice: number;
  category: string;
  brand?: string;
  model?: string;
  imageUrl?: string;
  discountPercent?: number;
}

export interface Inventory {
  id: number;
  serialNumber: string;
  status: 'AVAILABLE' | 'LOST' | 'MAINTENANCE' | 'ON_RENTAL' | 'PENDING_RETURN';
  productId: number;
  product?: Product;
  createdAt: string;
  updatedAt?: string;
}

export interface InventoryRequest {
  productId: number;
  serialNumber: string;
}

// Rental Types
export type RentalStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'ACTIVE' 
  | 'RETURNED' 
  | 'COMPLETED' 
  | 'CANCELED' 
  | 'OVERDUE';

export type ItemCondition = 'PENDING_CHECK' | 'GOOD' | 'DAMAGED';
export type DeliveryType = 'PERSONAL_PICKUP' | 'DELIVERY';
export type DeliveryStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'RETURNED';

export interface Rental {
  id: number;
  userId: number;
  renterUsername?: string;
  renterName?: string;
  renterEmail?: string;
  inventoryId: number;
  inventoryUnit?: Inventory;
  productName?: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  status: RentalStatus;
  totalPrice: number;
  depositAmount: number;
  depositReturned: boolean;
  itemCondition: ItemCondition;
  conditionNotes?: string;
  createdAt: string;
  // Delivery/Pickup fields
  deliveryType?: DeliveryType;
  awbNumber?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryStatus?: DeliveryStatus;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  pickupDate?: string;
  /** La predare (când primești dispozitivul) */
  handoverPhotoUrls?: string[];
  /** Înainte de returnare */
  preReturnPhotoUrls?: string[];
  aiComparisonJson?: string | null;
  aiComparisonAt?: string | null;
}

export interface RentalRequest {
  inventoryId: number;
  startDate: string;
  endDate: string;
  // Delivery/Pickup fields
  deliveryType?: DeliveryType;
  deliveryAddress?: string;
  deliveryPhone?: string;
  twoDayDelivery?: boolean;
}

export interface ConditionCheckRequest {
  condition: ItemCondition;
  notes?: string;
}

// Payment Types
export interface PaymentIntentRequest {
  rentalId: number;
  amount: number;
  currency?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// API Response Types
export interface ApiResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string>;
}

export interface ProductFinancialStats {
  productId: number;
  productName: string;
  category?: string;
  brand?: string;
  model?: string;
  rentalCount: number;
  income: number;
  expenses: number;
  netProfit: number;
}

export interface SuperOwnerStatistics {
  totalIncome: number;
  totalExpenses: number;
  totalNetProfit: number;
  totalRentals: number;
  products: ProductFinancialStats[];
}

// Auth Context Types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperOwner: boolean;
  isLoading: boolean;
}
