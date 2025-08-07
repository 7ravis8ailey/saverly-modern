# 🚨 CRITICAL: Supabase Database Setup Required

## ❌ **ISSUE IDENTIFIED:**

Your Saverly app is working locally but **not connecting to Supabase because the database tables don't exist**. When you created an account, it didn't save to Supabase because there are no tables to store the data in.

## 🔧 **IMMEDIATE SOLUTION (5 minutes):**

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard
2. Sign in to your account
3. Select your project: `lziayzusujlvhebyagdl`
4. Click "SQL Editor" in the left sidebar

### Step 2: Create the Database Tables
1. In the SQL Editor, click "New Query"
2. Copy and paste the **entire contents** of this file: `SUPABASE_COMPLETE_SETUP.sql`
3. Click "RUN" to execute all the SQL statements

**OR** use this quick setup SQL (copy this into SQL Editor):

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (connects to Supabase auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'trial', 'expired')),
  subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_period_start TIMESTAMPTZ,
  subscription_period_end TIMESTAMPTZ,
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}',
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  website_url TEXT,
  business_hours JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'buy_one_get_one')),
  discount_amount DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discounted_price DECIMAL(10, 2),
  minimum_purchase DECIMAL(10, 2) DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  max_redemptions INTEGER DEFAULT 100,
  current_redemptions INTEGER DEFAULT 0,
  terms_conditions TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Redemptions table
CREATE TABLE public.redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  redemption_code TEXT UNIQUE NOT NULL,
  qr_code_data TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Anyone can view active businesses" ON public.businesses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own redemptions" ON public.redemptions
  FOR ALL USING (auth.uid() = user_id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS \$\$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
\`\`\`

### Step 3: Verify Setup
After running the SQL, you should see these tables in your Supabase dashboard:
- ✅ `users`
- ✅ `businesses` 
- ✅ `coupons`
- ✅ `redemptions`

## 🧪 **Test After Setup:**

1. Go back to your app: http://localhost:5177/
2. Create a new account (or sign in with existing)
3. Check Supabase Dashboard → Table Editor → Users table
4. You should now see your user data!

## 🎯 **Why This Happened:**

Your Saverly app was configured correctly, but the Supabase project was empty - like trying to put data into a filing cabinet with no folders. The database schema defines the "folders" (tables) where your app stores user accounts, business data, coupons, etc.

## ✅ **What Will Work After Setup:**

- ✅ User registration and login
- ✅ Profile management 
- ✅ Subscription tracking
- ✅ Business and coupon data storage
- ✅ QR code redemptions
- ✅ All the features you tested locally

## 🚀 **Next Steps:**

After setting up the database:
1. Test user registration on your local app
2. Verify data appears in Supabase dashboard
3. Your app will be fully functional with real database storage!

---

**Need Help?** If you encounter any issues during setup, the problem is likely:
1. Missing permissions in Supabase project
2. SQL syntax errors (usually from copy/paste issues)
3. Project not selected correctly

The solution is always: ensure you're in the right Supabase project (`lziayzusujlvhebyagdl`) and run the SQL in the SQL Editor.