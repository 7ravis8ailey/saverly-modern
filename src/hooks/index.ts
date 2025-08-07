// Custom Hooks - Saverly v2.0.0

// Authentication hooks
export { useAuthProvider as useAuth } from './use-auth'

// UI hooks
export { useToast } from './use-toast'

// QR and Redemption hooks
export { useQRRedemption } from './use-qr-redemption'
export { useRedemptionFlow } from './use-redemption-flow'

// Coupon hooks
export { useCoupons } from './use-coupons'
export type { CouponFilter, CategoryFilter } from './use-coupons'

// Google Maps hooks
export { 
  useMandatoryAddress,
  createAddressValidator,
  isAddressSelected,
  getCoordinates,
  formatAddressDisplay
} from './use-mandatory-address'
export type { 
  PlaceDetails,
  UseMandatoryAddressOptions,
  UseMandatoryAddressReturn 
} from './use-mandatory-address'