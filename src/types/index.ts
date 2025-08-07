// Enhanced User types with comprehensive TypeScript support
export interface User {
  id: string; // Changed from uid for consistency with Supabase
  email: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  subscription_status: 'free' | 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  subscription_plan?: 'monthly' | 'yearly';
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_period_start?: string;
  subscription_period_end?: string;
  profile_image_url?: string;
  preferences?: UserPreferences;
  is_admin: boolean;
  user_role?: 'consumer' | 'business' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  notifications_enabled: boolean;
  location_sharing: boolean;
  email_marketing: boolean;
  theme: 'light' | 'dark' | 'system';
  distance_unit: 'miles' | 'kilometers';
}

// Auth Types for comprehensive type safety
export interface AuthUser {
  uid: string; // Used throughout the codebase
  id: string;
  email?: string;
  phone?: string;
  fullName?: string;
  accountType?: 'subscriber' | 'business' | 'admin';
  isAdmin?: boolean;
  subscriptionStatus?: 'free' | 'active' | 'cancelled' | 'past_due' | 'unpaid' | 'trialing';
  subscriptionPeriodEnd?: string;
  latitude?: number;
  longitude?: number;
  profile?: {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    createdAt?: string;
  };
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthResponse<T = AuthUser> {
  data: T | null;
  error: AuthError | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  metadata?: SignUpMetadata;
}

export interface SignUpMetadata extends Record<string, unknown> {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  accountType?: 'subscriber' | 'business';
}

// Business types
export interface Business {
  uid: string
  name: string
  description?: string
  category: 'Food & Beverage' | 'Retail' | 'Health & Wellness' | 'Entertainment & Recreation' | 'Personal Services'
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
  phone?: string
  email: string
  contactName: string
  createdAt: string
  updatedAt?: string
}

// Coupon types
export interface Coupon {
  uid: string
  businessUid: string
  title: string
  description: string
  discount: string
  startDate: string
  endDate: string
  active: boolean
  usageLimit: 'one_time' | 'daily' | 'monthly_one' | 'monthly_two' | 'monthly_four'
  monthlyLimit?: number
  createdAt: string
  updatedAt: string
  business?: Business
}

// Redemption types
export interface Redemption {
  uid: string
  userUid: string
  couponUid: string
  businessUid: string
  qrCode: string
  displayCode: string
  status: 'pending' | 'redeemed' | 'expired' | 'cancelled'
  redemptionMonth: string
  expiresAt: string
  redeemedAt?: string
  createdAt: string
  user?: User
  coupon?: Coupon
  business?: Business
}

// API response types
export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  accountType: 'subscriber' | 'business' // Always 'subscriber' for normal users, no UI selection
}

export interface CreateBusinessForm {
  name: string
  email: string
  contactName: string
  phone?: string
  address: string
  city: string
  state: string
  zipCode: string
  category: Business['category']
  description?: string
  latitude: number
  longitude: number
}

export interface CreateCouponForm {
  businessUid: string
  title: string
  description: string
  discount: string
  startDate: string
  endDate: string
  active: boolean
  usageLimit: Coupon['usageLimit']
  monthlyLimit?: number
}

// Stats types for admin dashboard
export interface AdminStats {
  totalUsers: number
  activeSubscribers: number
  totalBusinesses: number
  activeCoupons: number
  totalRedemptions: number
}

// Google Places API types
export interface GooglePlacesPrediction {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
  reference?: string
  matched_substrings?: Array<{
    length: number
    offset: number
  }>
  types: string[]
}

export interface GooglePlaceDetails {
  place_id: string
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry: {
    location: {
      lat(): number
      lng(): number
    }
    viewport?: {
      northeast: { lat(): number; lng(): number }
      southwest: { lat(): number; lng(): number }
    }
  }
  name?: string
  types: string[]
  url?: string
  website?: string
  international_phone_number?: string
  formatted_phone_number?: string
}

export interface PlaceDetailsFormatted {
  place_id: string
  formatted_address: string
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
}

// Google Maps API Status types
export const GoogleMapsStatus = {
  OK: 'OK',
  ZERO_RESULTS: 'ZERO_RESULTS',
  OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
  REQUEST_DENIED: 'REQUEST_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type GoogleMapsStatus = typeof GoogleMapsStatus[keyof typeof GoogleMapsStatus]

// Address validation types
export interface AddressValidationResult {
  isValid: boolean
  confidence: 'high' | 'medium' | 'low'
  errors?: string[]
  warnings?: string[]
  suggestions?: string[]
}

// Geocoding types
export interface GeocodeResult {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  accuracy: 'rooftop' | 'range_interpolated' | 'geometric_center' | 'approximate'
  place_id: string
}

// Re-export redemption types
export type {
  UsageLimitType,
  RedemptionErrorType,
  UsageLimitValidation,
  RedemptionValidationResult,
  RedemptionFlowState,
  RedemptionConfirmationData,
  RedemptionSuccessData
} from './redemption'