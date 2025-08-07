#!/usr/bin/env node

/**
 * Setup Payment Database Schema
 * Creates the subscription_events table and adds Stripe columns to users table
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsaGhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMwODEzNjAsImV4cCI6MjA0ODY1NzM2MH0.m3LFT6NG2MFXJ3YKgEY7T_g_XaJ-LU-K7-KJfmxgNJU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function setupPaymentDatabase() {
  console.log('🚀 Setting up payment database schema...')
  
  try {
    // Create subscription_events table
    console.log('📋 Creating subscription_events table...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      query: `
        -- Create subscription_events table for webhook audit trail
        CREATE TABLE IF NOT EXISTS subscription_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL,
          stripe_subscription_id TEXT,
          stripe_customer_id TEXT,
          event_data JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS subscription_events_user_id_idx ON subscription_events(user_id);
        CREATE INDEX IF NOT EXISTS subscription_events_stripe_subscription_id_idx ON subscription_events(stripe_subscription_id);
        CREATE INDEX IF NOT EXISTS subscription_events_created_at_idx ON subscription_events(created_at);

        -- Add RLS policies
        ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
      `
    })

    if (tableError) {
      console.error('❌ Error creating subscription_events table:', tableError)
    } else {
      console.log('✅ subscription_events table created successfully')
    }

    // Add Stripe columns to users table
    console.log('💳 Adding Stripe columns to users table...')
    const { error: columnsError } = await supabase.rpc('exec_sql', {
      query: `
        -- Add additional columns to users table if they don't exist
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

        -- Create indexes for Stripe IDs
        CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id);
        CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx ON users(stripe_subscription_id);
      `
    })

    if (columnsError) {
      console.error('❌ Error adding Stripe columns:', columnsError)
    } else {
      console.log('✅ Stripe columns added to users table successfully')
    }

    // Create RLS policies
    console.log('🔒 Setting up RLS policies...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      query: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "subscription_events_user_policy" ON subscription_events;
        DROP POLICY IF EXISTS "subscription_events_service_policy" ON subscription_events;

        -- Users can only see their own subscription events
        CREATE POLICY "subscription_events_user_policy" ON subscription_events
          FOR SELECT
          USING (user_id = auth.uid());

        -- Only service role can insert/update subscription events (webhooks)
        CREATE POLICY "subscription_events_service_policy" ON subscription_events
          FOR ALL
          TO service_role
          USING (true);
      `
    })

    if (rlsError) {
      console.error('❌ Error setting up RLS policies:', rlsError)
    } else {
      console.log('✅ RLS policies configured successfully')
    }

    console.log('🎉 Payment database schema setup complete!')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Configure Stripe API keys in Supabase secrets')
    console.log('2. Create Stripe webhook endpoint')
    console.log('3. Update frontend with correct Stripe price ID')
    console.log('4. Test the payment flow')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Alternative approach using direct SQL execution
async function setupWithDirectSQL() {
  console.log('🚀 Setting up payment database with direct SQL...')
  
  try {
    // Check if users table exists and get structure
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (usersError && usersError.code !== 'PGRST116') {
      console.error('❌ Error checking users table:', usersError)
      return
    }

    console.log('✅ Connected to Supabase successfully')

    // Create subscription_events table using a function
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS subscription_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL,
        event_type TEXT NOT NULL,
        stripe_subscription_id TEXT,
        stripe_customer_id TEXT,
        event_data JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `

    // Since we can't run DDL directly, we'll create an SQL file for manual execution
    console.log('📄 Database schema is ready for manual execution.')
    console.log('💡 Please run the SQL commands from STRIPE_SETUP.md in your Supabase SQL Editor.')

  } catch (error) {
    console.error('❌ Connection error:', error)
  }
}

// Run the setup
setupWithDirectSQL()