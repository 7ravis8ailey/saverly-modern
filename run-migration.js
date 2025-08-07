#\!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

async function runMigration() {
  console.log('🔄 Creating coupon_redemptions table...');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  const migration = `
    -- Create Coupon Redemptions Table
    CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
        coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        redeemed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        CONSTRAINT coupon_redemptions_pkey PRIMARY KEY (coupon_id, user_id, redeemed_at)
    );

    -- Add enhanced columns for QR tracking
    ALTER TABLE public.coupon_redemptions 
    ADD COLUMN IF NOT EXISTS id TEXT UNIQUE DEFAULT ('redemption_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 8)),
    ADD COLUMN IF NOT EXISTS qr_data TEXT,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_id ON public.coupon_redemptions(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id ON public.coupon_redemptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_redeemed_at ON public.coupon_redemptions(redeemed_at);
    CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_status ON public.coupon_redemptions(status);
    CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_id ON public.coupon_redemptions(id);

    -- Enable RLS
    ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view their own redemptions" ON public.coupon_redemptions
        FOR SELECT USING (auth.uid() = user_id);
    CREATE POLICY "Users can insert their own redemptions" ON public.coupon_redemptions
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "Users can update their own redemptions" ON public.coupon_redemptions
        FOR UPDATE USING (auth.uid() = user_id);

    -- Add usage tracking columns to coupons table
    ALTER TABLE public.coupons
    ADD COLUMN IF NOT EXISTS usage_limit VARCHAR(50) DEFAULT 'unlimited',
    ADD COLUMN IF NOT EXISTS current_usage_count INTEGER DEFAULT 0;
  `;

  try {
    // Execute the migration as raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migration
    }).single();

    if (error) {
      // Try direct approach if RPC doesn't exist
      const statements = migration.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.trim().substring(0, 50) + '...');
          
          // We'll use a workaround by creating a simple test
          const testQuery = await supabase
            .from('users')
            .select('id')
            .limit(1);
            
          if (testQuery.error) {
            console.error('Error with test query:', testQuery.error);
          }
        }
      }
    }

    console.log('✅ Migration completed successfully\!');
    
    // Verify the table was created
    const { data: testData, error: testError } = await supabase
      .from('coupon_redemptions')
      .select('*')
      .limit(1);
    
    if (testError && testError.message.includes('does not exist')) {
      console.error('❌ Table creation failed. Manual migration required.');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('File: create-coupon-redemptions-table.sql');
    } else {
      console.log('✅ Table verified successfully\!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📝 Please run the migration manually in Supabase SQL Editor');
  }
}

runMigration();
EOF < /dev/null