#!/usr/bin/env node
/**
 * Create Missing Tables Script
 * Creates tables and columns using individual operations
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

async function createMissingElements() {
  console.log('🔧 CREATING MISSING DATABASE ELEMENTS');
  console.log('=====================================');
  
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // First, let's check what we have in the businesses table
  console.log('1️⃣ Checking current businesses table structure...');
  
  try {
    const { data: businesses, error: businessError } = await adminClient
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (businessError) {
      console.log('❌ Businesses table error:', businessError.message);
      
      if (businessError.code === '42P01') {
        // Table doesn't exist
        console.log('⚠️ Businesses table does not exist - will need manual creation');
      } else if (businessError.message.includes('contact_name')) {
        console.log('⚠️ contact_name column missing - will need manual addition');
      }
    } else {
      console.log('✅ Businesses table accessible');
      
      if (businesses && businesses.length > 0) {
        console.log('   Sample business:', {
          id: businesses[0].id,
          name: businesses[0].name,
          hasContactName: 'contact_name' in businesses[0],
          hasPhone: 'phone' in businesses[0],
          hasCity: 'city' in businesses[0]
        });
      }
    }
  } catch (error) {
    console.log('❌ Error checking businesses table:', error.message);
  }
  
  // Check webhook_events table
  console.log('\\n2️⃣ Checking webhook_events table...');
  
  try {
    const { data: webhooks, error: webhookError } = await adminClient
      .from('webhook_events')
      .select('*')
      .limit(1);
    
    if (webhookError) {
      if (webhookError.code === '42P01') {
        console.log('⚠️ webhook_events table does not exist');
      } else {
        console.log('❌ Webhook events error:', webhookError.message);
      }
    } else {
      console.log('✅ webhook_events table accessible');
    }
  } catch (error) {
    console.log('❌ Error checking webhook_events table:', error.message);
  }
  
  // Check coupons table  
  console.log('\\n3️⃣ Checking coupons table...');
  
  try {
    const { data: coupons, error: couponError } = await adminClient
      .from('coupons')
      .select('*')
      .limit(1);
    
    if (couponError) {
      if (couponError.code === '42P01') {
        console.log('⚠️ coupons table does not exist');
      } else {
        console.log('❌ Coupons error:', couponError.message);
      }
    } else {
      console.log('✅ coupons table accessible');
    }
  } catch (error) {
    console.log('❌ Error checking coupons table:', error.message);
  }
  
  console.log('\\n📋 SUMMARY OF REQUIRED FIXES:');
  console.log('=============================');
  console.log('⚠️  The following database changes are needed:');
  console.log('');
  console.log('1. CREATE webhook_events table with columns:');
  console.log('   - id, type, data, attempts, status, error_message, next_attempt_at, created_at, updated_at');
  console.log('');
  console.log('2. ALTER businesses table to ADD columns:');
  console.log('   - contact_name, phone, city, state, zip_code, created_at, updated_at');
  console.log('');
  console.log('3. ENSURE coupons table exists with proper structure');
  console.log('');
  console.log('4. CREATE get_webhook_stats() function');
  console.log('');
  console.log('🔧 MANUAL FIXES REQUIRED:');
  console.log('========================');
  console.log('Since the Supabase API cannot execute DDL statements, please run these SQL commands');
  console.log('manually in the Supabase SQL Editor:');
  console.log('');
  console.log('-- 1. Create webhook_events table');
  console.log(`CREATE TABLE IF NOT EXISTS public.webhook_events (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    attempts INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    next_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
  CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(type);
  ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;`);
  
  console.log('');
  console.log('-- 2. Add missing columns to businesses table');
  console.log(`ALTER TABLE public.businesses 
    ADD COLUMN IF NOT EXISTS contact_name TEXT,
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state VARCHAR(50),
    ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`);
  
  console.log('');
  console.log('-- 3. Create webhook stats function');
  console.log(`CREATE OR REPLACE FUNCTION public.get_webhook_stats()
  RETURNS JSON AS $$
  DECLARE stats JSON;
  BEGIN
      SELECT json_build_object(
          'pending', COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0),
          'processing', COALESCE(COUNT(*) FILTER (WHERE status = 'processing'), 0),
          'failed', COALESCE(COUNT(*) FILTER (WHERE status = 'failed'), 0),
          'completed', COALESCE(COUNT(*) FILTER (WHERE status = 'completed'), 0)
      ) INTO stats
      FROM public.webhook_events
      WHERE created_at > NOW() - INTERVAL '24 hours';
      
      RETURN COALESCE(stats, '{"pending":0,"processing":0,"failed":0,"completed":0}'::JSON);
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;`);
  
  console.log('');
  console.log('🚀 AFTER RUNNING THE SQL COMMANDS:');
  console.log('==================================');
  console.log('Run: node test-comprehensive-features.js');
  console.log('This will verify all features are working correctly.');
  
  return false; // Indicates manual intervention needed
}

// Run the check
createMissingElements()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });