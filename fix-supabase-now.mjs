#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase connection
const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

console.log(`
🚀 Saverly Database Connection Fix
==================================

This script will help you properly connect your Saverly app to Supabase.

Current Issue:
- Your app works locally ✅
- But data isn't saving to Supabase ❌
- Because the database tables don't exist ❌

Solution:
1. We'll provide the exact SQL to run
2. Show you where to run it
3. Verify it works
`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCurrentStatus() {
  console.log('🔍 Checking current database status...\n');
  
  // Test auth
  const { data: authTest, error: authError } = await supabase.auth.signUp({
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123'
  });
  
  if (authTest?.user) {
    console.log('✅ Supabase Auth is working');
    console.log(`   User ID: ${authTest.user.id}`);
    
    // Try to clean up test user
    await supabase.auth.admin.deleteUser(authTest.user.id).catch(() => {});
  } else {
    console.log('⚠️  Auth test failed:', authError?.message);
  }
  
  // Check tables
  console.log('\n📊 Checking for required tables...');
  const requiredTables = ['users', 'businesses', 'coupons', 'redemptions'];
  let missingTables = [];
  
  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select('count').limit(0);
    if (error?.code === '42P01') {
      console.log(`❌ Table missing: ${table}`);
      missingTables.push(table);
    } else if (!error) {
      console.log(`✅ Table exists: ${table}`);
    } else {
      console.log(`⚠️  Table issue: ${table} - ${error.code}`);
      missingTables.push(table);
    }
  }
  
  return missingTables;
}

async function generateSetupInstructions(missingTables) {
  if (missingTables.length === 0) {
    console.log('\n🎉 Great news! All tables exist. Your database is properly set up!');
    console.log('\nIf user data still isn\'t saving, check:');
    console.log('1. RLS policies might be blocking writes');
    console.log('2. The trigger function might need adjustment');
    return;
  }
  
  console.log(`
❌ Missing ${missingTables.length} required tables: ${missingTables.join(', ')}

🔧 TO FIX THIS IMMEDIATELY:
===========================

1. Open Supabase Dashboard:
   👉 https://supabase.com/dashboard/project/lziayzusujlvhebyagdl/sql/new

2. Copy the SQL below and paste it into the SQL Editor:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  // Read and display the SQL
  const sqlPath = path.join(__dirname, 'SUPABASE_COMPLETE_SETUP.sql');
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(sql.substring(0, 2000) + '\n... [Full SQL in SUPABASE_COMPLETE_SETUP.sql]');
  } else {
    // Provide minimal setup SQL
    console.log(`
-- Quick Setup SQL (copy everything below)
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. Click the "RUN" button in Supabase SQL Editor

4. After running, you should see "Success" messages

5. Test your app again - user registration will now work!

📝 Alternative: Command Line Setup
==================================
If you have the database password, run:
export SUPABASE_DB_PASSWORD='your-password-here'
chmod +x setup-database-cli.sh
./setup-database-cli.sh
`);
}

async function createVerificationScript() {
  const verifyScript = `
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  '${supabaseUrl}',
  '${supabaseAnonKey}'
);

async function verifySetup() {
  console.log('🧪 Verifying Saverly database setup...\\n');
  
  // Create test user
  const testEmail = 'verify-' + Date.now() + '@test.com';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'test123456'
  });
  
  if (authError) {
    console.log('❌ Auth signup failed:', authError.message);
    return;
  }
  
  console.log('✅ Auth working - User created:', authData.user.id);
  
  // Check if user was added to users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  
  if (userData) {
    console.log('✅ User profile created automatically!');
    console.log('   Email:', userData.email);
    console.log('\\n🎉 SUCCESS! Your database is properly connected!');
  } else {
    console.log('❌ User profile not created:', userError?.message);
    console.log('   The trigger might need adjustment');
  }
}

verifySetup().catch(console.error);
`;

  fs.writeFileSync('verify-database.mjs', verifyScript);
  console.log('\n✅ Created verify-database.mjs - Run this after setting up the database');
}

// Run the checks
(async () => {
  const missingTables = await checkCurrentStatus();
  await generateSetupInstructions(missingTables);
  await createVerificationScript();
  
  console.log(`
📌 NEXT STEPS:
1. Run the SQL in Supabase Dashboard (link above)
2. Run: node verify-database.mjs
3. Try creating an account in your app
4. Check Supabase dashboard to see the user data

Need the direct link? 
👉 https://supabase.com/dashboard/project/lziayzusujlvhebyagdl/sql/new
`);
})();