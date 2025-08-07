#!/bin/bash

# Saverly Database Setup Script
echo "🚀 Setting up Saverly Database..."

# Database connection details
DB_HOST="aws-0-us-east-1.pooler.supabase.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres.lziayzusujlvhebyagdl"

# Check if password is provided
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo "❌ Error: SUPABASE_DB_PASSWORD environment variable not set"
    echo "Please run: export SUPABASE_DB_PASSWORD='your-database-password'"
    echo "You can find this in your Supabase dashboard under Settings > Database"
    exit 1
fi

# Create a temporary SQL file with our schema
cat > temp_schema.sql << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (connects to Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
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
CREATE TABLE IF NOT EXISTS public.businesses (
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
CREATE TABLE IF NOT EXISTS public.coupons (
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
CREATE TABLE IF NOT EXISTS public.redemptions (
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
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test query to verify setup
SELECT 'Database setup complete!' as status;
EOF

echo "📝 Deploying schema to Supabase..."

# Use psql to connect and run the schema
PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f temp_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema deployed successfully!"
    echo ""
    echo "🧪 Testing database connection..."
    
    # Test the tables were created
    PGPASSWORD=$SUPABASE_DB_PASSWORD psql \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'businesses', 'coupons', 'redemptions');"
    
    echo ""
    echo "🎉 Your Saverly database is now set up and ready!"
    echo "✅ User registration will now work properly"
    echo "✅ All data will be saved to Supabase"
    echo "✅ You can verify in your Supabase dashboard"
else
    echo "❌ Database setup failed"
    echo "Please check your database password and try again"
fi

# Clean up
rm -f temp_schema.sql