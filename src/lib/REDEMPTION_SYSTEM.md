# Coupon Redemption System

## Overview

The Saverly coupon redemption system implements the complete flow for validating, confirming, and processing coupon redemptions with sophisticated usage limit validation, exactly as it was in the original Saverly application.

## Key Features

### ✅ Usage Limit Types
- **one_time**: Single-use coupons
- **daily**: One redemption per day
- **monthly_one**: One redemption per calendar month
- **monthly_two**: Two redemptions per calendar month  
- **monthly_four**: Four redemptions per calendar month

### ✅ Validation System
- Real-time usage limit checking
- Month-based redemption tracking
- Subscription status validation
- Coupon expiration and status checks

### ✅ User Experience Flow
1. **Validation** - Check eligibility and usage limits
2. **Confirmation** - 60-second countdown dialog with warnings
3. **QR Generation** - Create unique QR code with 60-second expiration
4. **Success Animation** - "Successful Redemption - Thank you for using Saverly!"

## Implementation Files

### Core Types
- `src/types/redemption.ts` - All redemption-related TypeScript types
- `src/types/index.ts` - Updated with new usage limit types

### Validation Logic
- `src/lib/redemption-validation.ts` - Core validation algorithms
- `database/06-enhanced-usage-limits.sql` - Enhanced SQL functions

### React Components
- `src/components/redemption-confirmation-dialog.tsx` - 60-second confirmation
- `src/components/success-animation.tsx` - Animated success feedback
- `src/components/enhanced-qr-modal.tsx` - Complete QR modal integration

### React Hooks
- `src/hooks/use-redemption-flow.ts` - Complete redemption state management
- `src/hooks/index.ts` - Updated exports

### Tests
- `src/test/redemption-flow.test.ts` - Comprehensive test suite

## Usage Examples

### Basic Redemption Flow

```tsx
import { useRedemptionFlow } from '@/hooks/use-redemption-flow';
import { EnhancedQRModal } from '@/components/enhanced-qr-modal';

function CouponCard({ coupon, userUid }) {
  const [showQR, setShowQR] = useState(false);
  
  const handleRedeem = () => {
    setShowQR(true);
  };

  return (
    <div>
      <button onClick={handleRedeem}>
        Redeem Coupon
      </button>
      
      <EnhancedQRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        coupon={coupon}
        userUid={userUid}
        onRedemptionSuccess={(data) => {
          console.log('Redemption successful:', data);
        }}
        onRedemptionError={(error, errorType) => {
          console.error('Redemption failed:', error, errorType);
        }}
      />
    </div>
  );
}
```

### Manual Validation

```tsx
import { validateRedemption } from '@/lib/redemption-validation';

async function checkEligibility(userUid, couponUid) {
  const result = await validateRedemption(userUid, couponUid);
  
  if (!result.canProceed) {
    console.log('Cannot redeem:', result.errorMessage);
    console.log('Error type:', result.errorType);
    return false;
  }
  
  console.log('Usage info:', result.usageValidation);
  return true;
}
```

### Success Animation

```tsx
import { SuccessAnimation, useSuccessAnimation } from '@/components/success-animation';

function MyComponent() {
  const successAnimation = useSuccessAnimation();
  
  const handleSuccess = () => {
    successAnimation.showSuccess({
      redemptionId: 'redeem-123',
      couponTitle: 'Free Coffee',
      businessName: 'Coffee Shop',
      discountAmount: '$5 off',
      savedAmount: '$5.00',
      redemptionCode: 'ABC12345',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div>
      <button onClick={handleSuccess}>Test Success</button>
      
      <SuccessAnimation
        isVisible={successAnimation.isVisible}
        onComplete={successAnimation.hideSuccess}
        successData={successAnimation.successData}
      />
    </div>
  );
}
```

## Database Schema

### Enhanced Usage Limits

The system uses enhanced SQL functions for validation:

```sql
-- Check usage limits for any coupon
SELECT check_enhanced_usage_limit(
  'user-uuid'::UUID,
  'coupon-uuid'::UUID, 
  'monthly_two',
  NULL
);

-- Get complete usage statistics
SELECT get_enhanced_user_coupon_usage(
  'user-uuid'::UUID,
  'coupon-uuid'::UUID
);

-- Batch check multiple coupons
SELECT batch_check_usage_limits(
  'user-uuid'::UUID,
  ARRAY['coupon1-uuid', 'coupon2-uuid']::UUID[]
);
```

### Usage Tracking

Redemptions are tracked using:
- `redemption_month` field in YYYY-MM format
- `status` field for redemption state
- Indexed queries for performance

## Error Handling

### Error Types

```typescript
type RedemptionErrorType = 
  | 'ALREADY_REDEEMED'
  | 'DAILY_LIMIT_REACHED' 
  | 'MONTHLY_LIMIT_REACHED'
  | 'COUPON_EXPIRED'
  | 'COUPON_INACTIVE'
  | 'USER_NOT_SUBSCRIBED'
  | 'VALIDATION_FAILED'
  | 'NETWORK_ERROR';
```

### Error Messages

Each error type has a specific user-friendly message:

```typescript
const ERROR_MESSAGES = {
  'ALREADY_REDEEMED': 'You have already redeemed this coupon. One-time coupons can only be used once.',
  'DAILY_LIMIT_REACHED': 'You have already redeemed this coupon today. Please try again tomorrow.',
  'MONTHLY_LIMIT_REACHED': 'You have reached the monthly limit for this coupon. Please try again next month.',
  // ... etc
};
```

## Performance Optimizations

### Database Indexes
- `idx_redemptions_monthly_usage` - Monthly redemption queries
- `idx_redemptions_user_coupon_week` - Weekly redemption queries
- Existing indexes for daily and one-time checks

### React Optimizations
- Memoized validation functions
- Efficient state management
- Batched database operations
- Lazy component loading

## Testing

Run the test suite:

```bash
npm run test src/test/redemption-flow.test.ts
```

Tests cover:
- All usage limit types
- Error scenarios
- Month-based tracking
- Complete validation flow
- Component integration

## Migration from Legacy System

To migrate existing coupons to the new usage limit types:

```sql
-- Update monthly coupons to specific types
UPDATE coupons SET usage_limit = 'monthly_one' 
WHERE usage_limit = 'monthly' AND monthly_limit = 1;

UPDATE coupons SET usage_limit = 'monthly_two' 
WHERE usage_limit = 'monthly' AND monthly_limit = 2;

UPDATE coupons SET usage_limit = 'monthly_four' 
WHERE usage_limit = 'monthly' AND monthly_limit = 4;
```

## Security Considerations

- All validation functions use `SECURITY DEFINER`
- User permissions controlled via RLS policies
- QR codes expire automatically after 60 seconds
- Redemption codes are cryptographically unique
- Input validation on all user inputs

## Monitoring and Analytics

Track redemption metrics:
- Usage limit violation attempts
- Successful redemption rates
- Average time from validation to redemption
- Error type frequencies
- QR code expiration rates

## Support

For issues or questions about the redemption system:
1. Check the test suite for usage examples
2. Review the validation logic in `redemption-validation.ts`
3. Examine component state management in hooks
4. Test with the enhanced QR modal implementation