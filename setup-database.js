import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function executeSQL(sql, description) {
  try {
    console.log(`🔄 ${description}...`)
    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      console.error(`❌ ${description} failed:`, error)
      return false
    } else {
      console.log(`✅ ${description} completed successfully`)
      return true
    }
  } catch (err) {
    console.error(`❌ ${description} error:`, err.message)
    return false
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Saverly database schema...\n')
    
    // Step 1: Enable extensions
    console.log('📦 Setting up database extensions...')
    const extensionSQL = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
    await executeSQL(extensionSQL, 'Enable UUID extension')
    
    // Step 2: Create tables
    console.log('\n🏗️ Creating database tables...')
    
    // Users table
    const usersSQL = `
    CREATE TABLE IF NOT EXISTS public.users (
      uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      full_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      account_type TEXT CHECK (account_type IN ('subscriber', 'admin', 'business')) DEFAULT 'subscriber' NOT NULL,
      is_admin BOOLEAN DEFAULT false,
      subscription_status TEXT CHECK (subscription_status IN ('active', 'inactive')) DEFAULT 'inactive' NOT NULL,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_period_end TIMESTAMPTZ,
      subscription_period_start TIMESTAMPTZ,
      subscription_plan TEXT CHECK (subscription_plan IN ('monthly', 'yearly')),
      subscription_canceled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
    await executeSQL(usersSQL, 'Create users table')
    
    // Businesses table
    const businessesSQL = `
    CREATE TABLE IF NOT EXISTS public.businesses (
      uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      category TEXT CHECK (category IN ('Food & Beverage', 'Retail', 'Health & Wellness', 'Entertainment & Recreation', 'Personal Services')) NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      phone TEXT,
      email TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
    await executeSQL(businessesSQL, 'Create businesses table')
    
    // Coupons table
    const couponsSQL = `
    CREATE TABLE IF NOT EXISTS public.coupons (
      uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      business_uid UUID REFERENCES public.businesses(uid) NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      discount TEXT NOT NULL,
      start_date TIMESTAMPTZ NOT NULL,
      end_date TIMESTAMPTZ NOT NULL,
      active BOOLEAN DEFAULT true NOT NULL,
      usage_limit TEXT CHECK (usage_limit IN ('one_time', 'daily', 'monthly')) DEFAULT 'one_time' NOT NULL,
      monthly_limit INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );`
    await executeSQL(couponsSQL, 'Create coupons table')
    
    // Redemptions table
    const redemptionsSQL = `
    CREATE TABLE IF NOT EXISTS public.redemptions (
      uid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_uid UUID REFERENCES public.users(uid) NOT NULL,
      coupon_uid UUID REFERENCES public.coupons(uid) NOT NULL,
      business_uid UUID REFERENCES public.businesses(uid) NOT NULL,
      qr_code TEXT UNIQUE NOT NULL,
      display_code TEXT UNIQUE NOT NULL,
      status TEXT CHECK (status IN ('pending', 'redeemed', 'expired', 'cancelled')) DEFAULT 'pending' NOT NULL,
      redemption_month TIMESTAMPTZ NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      redeemed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );`
    await executeSQL(redemptionsSQL, 'Create redemptions table')
    
    // Step 3: Create indexes
    console.log('\n🔍 Creating performance indexes...')
    const indexesSQL = `
    -- Users indexes
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
    CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
    CREATE INDEX IF NOT EXISTS idx_users_account_type ON public.users(account_type);
    CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(latitude, longitude);
    
    -- Businesses indexes
    CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses(category);
    CREATE INDEX IF NOT EXISTS idx_businesses_location ON public.businesses(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_businesses_email ON public.businesses(email);
    
    -- Coupons indexes
    CREATE INDEX IF NOT EXISTS idx_coupons_business_uid ON public.coupons(business_uid);
    CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active, start_date, end_date);
    
    -- Redemptions indexes
    CREATE INDEX IF NOT EXISTS idx_redemptions_user_uid ON public.redemptions(user_uid);
    CREATE INDEX IF NOT EXISTS idx_redemptions_coupon_uid ON public.redemptions(coupon_uid);
    CREATE INDEX IF NOT EXISTS idx_redemptions_business_uid ON public.redemptions(business_uid);
    CREATE INDEX IF NOT EXISTS idx_redemptions_status ON public.redemptions(status);
    CREATE INDEX IF NOT EXISTS idx_redemptions_qr_code ON public.redemptions(qr_code);
    CREATE INDEX IF NOT EXISTS idx_redemptions_display_code ON public.redemptions(display_code);
    CREATE INDEX IF NOT EXISTS idx_redemptions_monthly ON public.redemptions(user_uid, coupon_uid, redemption_month);
    `
    await executeSQL(indexesSQL, 'Create performance indexes')
    
    // Step 4: Enable RLS
    console.log('\n🔒 Enabling Row Level Security...')
    const rlsSQL = `
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
    `
    await executeSQL(rlsSQL, 'Enable Row Level Security')
    
    // Step 5: Create RLS policies
    console.log('\n📋 Creating security policies...')
    
    // Drop existing policies first
    const dropPoliciesSQL = `
    DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
    DROP POLICY IF EXISTS "Anyone can view businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Admins can modify businesses" ON public.businesses;
    DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
    DROP POLICY IF EXISTS "Admins can view all coupons" ON public.coupons;
    DROP POLICY IF EXISTS "Admins can modify coupons" ON public.coupons;
    DROP POLICY IF EXISTS "Users can view own redemptions" ON public.redemptions;
    DROP POLICY IF EXISTS "Users can create redemptions" ON public.redemptions;
    DROP POLICY IF EXISTS "Admins can modify redemptions" ON public.redemptions;
    `
    await executeSQL(dropPoliciesSQL, 'Drop existing policies')
    
    const policiesSQL = `
    -- Users policies
    CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid()::text = uid::text OR EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
    CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = uid::text);
    CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid()::text = uid::text);
    
    -- Businesses policies
    CREATE POLICY "Anyone can view businesses" ON public.businesses FOR SELECT USING (true);
    CREATE POLICY "Admins can modify businesses" ON public.businesses FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
    
    -- Coupons policies
    CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (active = true AND start_date <= NOW() AND end_date >= NOW());
    CREATE POLICY "Admins can view all coupons" ON public.coupons FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
    CREATE POLICY "Admins can modify coupons" ON public.coupons FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
    
    -- Redemptions policies
    CREATE POLICY "Users can view own redemptions" ON public.redemptions FOR SELECT USING (auth.uid()::text = user_uid::text OR EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
    CREATE POLICY "Users can create redemptions" ON public.redemptions FOR INSERT WITH CHECK (auth.uid()::text = user_uid::text);
    CREATE POLICY "Admins can modify redemptions" ON public.redemptions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE uid::text = auth.uid()::text AND is_admin = true));
    `
    await executeSQL(policiesSQL, 'Create security policies')
    
    // Step 6: Create trigger function
    console.log('\n⚙️ Creating trigger functions...')
    const functionSQL = `
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `
    await executeSQL(functionSQL, 'Create updated_at trigger function')
    
    // Step 7: Create triggers
    const triggersSQL = `
    DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
    DROP TRIGGER IF EXISTS handle_businesses_updated_at ON public.businesses;
    DROP TRIGGER IF EXISTS handle_coupons_updated_at ON public.coupons;
    
    CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER handle_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    CREATE TRIGGER handle_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    `
    await executeSQL(triggersSQL, 'Create updated_at triggers')
    
    console.log('\n🎉 Database schema setup completed successfully!')
    console.log('\n📋 Next steps:')
    console.log('1. Run: node create-test-users.js (to create test users)')
    console.log('2. Run: node insert-sample-data.js (to add sample data)')
    console.log('3. Test the application with the new database')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

// Alternative method using direct SQL execution if RPC doesn't work
async function setupDatabaseDirect() {
  try {
    console.log('🚀 Setting up Saverly database schema (direct method)...\n')
    
    // Read the schema file
    const schema = readFileSync('./supabase-schema.sql', 'utf8')
    
    // Split into individual statements and execute each
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';'
      if (statement.length > 1) {
        console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.from('_').select('*').limit(0) // This won't work, but shows the pattern
        // We'll need to use a different approach for direct SQL
      }
    }
    
  } catch (error) {
    console.error('❌ Direct setup failed:', error.message)
    console.log('💡 Trying structured approach instead...')
    await setupDatabase()
  }
}

setupDatabase()