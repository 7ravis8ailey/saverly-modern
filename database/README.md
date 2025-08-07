# Saverly Modern v2.0.0 - Database Setup Guide

This directory contains the complete database schema and setup files for the Saverly coupon marketplace platform.

## 📋 Prerequisites

- Access to Supabase Dashboard: [lziayzusujlvhebyagdl.supabase.co](https://lziayzusujlvhebyagdl.supabase.co)
- Project admin access
- SQL Editor access in Supabase Dashboard

## 🚀 Setup Instructions

### Step 1: Apply Database Schema
1. Open Supabase Dashboard > SQL Editor
2. Copy and paste the contents of `01-schema.sql`
3. Click "RUN" to create all tables, indexes, and constraints

### Step 2: Configure Row Level Security
1. In SQL Editor, copy and paste the contents of `02-rls-policies.sql`
2. Click "RUN" to enable RLS and create all security policies

### Step 3: Add Functions and Triggers
1. In SQL Editor, copy and paste the contents of `03-functions-triggers.sql`
2. Click "RUN" to create utility functions and automated triggers

### Step 4: Insert Sample Data (Optional)
1. In SQL Editor, copy and paste the contents of `04-sample-data.sql`
2. Click "RUN" to populate the database with test data

### Step 5: Create Analytics Views (Optional)
1. In SQL Editor, copy and paste the contents of `05-views-analytics.sql`
2. Click "RUN" to create performance and analytics views

## 📊 Database Structure

### Core Tables

#### `users`
- Extends Supabase auth.users
- Stores user profiles, subscription status, and location data
- Linked to auth.users via `auth_uid` field

#### `businesses`
- Business information with geolocation
- Verification status and performance metrics
- Linked to owner via `owner_uid`

#### `coupons`
- Coupon details with usage limits and validation rules
- Support for multiple coupon types (percentage, fixed, BOGO, free item)
- Automatic redemption tracking

#### `redemptions`
- Tracks coupon usage with QR codes
- Automatic expiration and usage limit enforcement
- Transaction and savings tracking

### Additional Features

#### `user_favorites`
- User's saved businesses and coupons

#### `notifications`
- Push notifications and system messages

#### `business_reviews`
- User reviews and ratings for businesses

#### `analytics_events`
- System analytics and user behavior tracking

#### `subscription_plans`
- Configurable subscription tiers and pricing

## 🔐 Security Features

### Row Level Security (RLS)
- **Users**: Can only access their own data, admins see all
- **Businesses**: Public read for active businesses, owner/admin write
- **Coupons**: Public read for active coupons, owner/admin write
- **Redemptions**: Users see own, business owners see theirs, admins see all

### Helper Functions
- `is_admin()`: Check if current user is admin
- `owns_business(business_id)`: Check business ownership
- `has_active_subscription()`: Verify subscription status

## 🔄 Automated Features

### Triggers
- **User Sync**: Automatically sync auth.users with public.users
- **Rating Updates**: Auto-calculate business ratings from reviews
- **Statistics**: Update business stats on coupon/redemption changes
- **QR Codes**: Auto-generate unique codes for redemptions
- **Usage Limits**: Enforce coupon usage restrictions

### Functions
- **Notifications**: Create system notifications
- **Cleanup**: Archive old data and expire redemptions
- **Usage Validation**: Check coupon limits before redemption

## 📈 Analytics & Reporting

### Available Views
- `business_performance`: Business metrics and ratings
- `top_coupons`: Most successful coupon campaigns
- `user_activity_summary`: User engagement metrics
- `subscription_analytics`: Revenue and subscription data
- `admin_dashboard`: Comprehensive admin overview

### Key Metrics
- Total customer savings provided
- Redemption rates and success metrics
- Geographic distribution analysis
- Revenue and subscription analytics

## 🧪 Sample Data

The sample data includes:
- **6 Sample Businesses** across different categories
- **10 Sample Coupons** with various discount types
- **4 Sample Users** with different subscription statuses
- **5 Sample Redemptions** showing the full lifecycle
- **3 Subscription Plans** (Basic, Premium, Unlimited)

## 🔧 Configuration

### Required Environment Variables
```bash
SUPABASE_URL=https://lziayzusujlvhebyagdl.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Google Maps Integration
- Businesses support full address geocoding
- PostGIS extension enabled for advanced geospatial queries
- Location-based search and filtering capabilities

### Stripe Integration
- User subscription tracking with Stripe customer IDs
- Support for monthly and yearly billing cycles
- Automatic subscription status synchronization

## 🚨 Important Notes

1. **Auth Integration**: The `users` table automatically syncs with Supabase auth.users via triggers
2. **Data Integrity**: Foreign key constraints ensure referential integrity
3. **Performance**: Indexes optimized for common query patterns
4. **Scalability**: Designed to handle thousands of businesses and users
5. **Security**: All sensitive operations protected by RLS policies

## 🔍 Verification Queries

After setup, verify your installation with these queries:

```sql
-- Check table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify sample data
SELECT 'businesses' as table_name, COUNT(*) as count FROM public.businesses
UNION ALL
SELECT 'coupons', COUNT(*) FROM public.coupons
UNION ALL
SELECT 'users', COUNT(*) FROM public.users
UNION ALL
SELECT 'redemptions', COUNT(*) FROM public.redemptions;

-- Test RLS policies
SELECT schemaname, tablename, policyname, permissive 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## 🆘 Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you have admin access to the Supabase project
2. **Extension Errors**: PostGIS extension may need manual enabling
3. **Trigger Failures**: Check that auth schema is accessible
4. **RLS Issues**: Verify policies are correctly applied

### Support

For issues or questions:
1. Check the verification queries above
2. Review the Supabase Dashboard logs
3. Ensure all files were applied in the correct order
4. Verify your Supabase project permissions

## 📝 Maintenance

### Regular Tasks
- Run cleanup functions to archive old data
- Monitor redemption expiration and notify users
- Update business statistics and ratings
- Backup critical data regularly

### Scheduled Functions (Recommended)
```sql
-- Run daily via cron or Supabase Edge Functions
SELECT public.cleanup_expired_redemptions();
SELECT public.notify_expiring_coupons();
SELECT public.archive_old_analytics();
```

This database setup provides a robust, scalable foundation for the Saverly coupon marketplace with comprehensive security, analytics, and automation features.