# Saverly Setup Instructions

## Database Setup

### 1. Apply Usage Limit Functions to Supabase

**CRITICAL**: You must run the SQL function in `supabase/functions/check-usage-limits.sql` in your Supabase dashboard.

**Steps**:
1. Go to your Supabase dashboard: https://lziayzusujlvhebyagdl.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `supabase/functions/check-usage-limits.sql`
4. Run the SQL to create the functions

**What this creates**:
- `check_usage_limit()` - Validates if user can redeem based on usage limits
- `get_user_coupon_usage()` - Gets current usage stats for a user/coupon
- Performance indexes for redemption queries

### 2. Environment Variables

Ensure your `.env` file has all required variables:
```
VITE_SUPABASE_URL=https://lziayzusujlvhebyagdl.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

### 3. Usage Limit Functionality

**Once the SQL functions are applied, the following will work**:
- ✅ Users see usage limits on coupon cards
- ✅ Users see remaining uses ("2 uses left this month")
- ✅ Redemption validation prevents exceeding limits
- ✅ Monthly usage resets automatically on the 1st
- ✅ Daily usage resets at midnight

**Business Logic**:
- `one_time`: Can only be used once ever by each user
- `daily`: Can be used once per day by each user  
- `monthly`: Can be used X times per month (set by admin)

**Monthly Reset**: Automatic on 1st of each month using `redemption_month` field.