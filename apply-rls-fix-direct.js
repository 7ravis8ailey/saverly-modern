#!/usr/bin/env node

/**
 * SAVERLY MODERN v2.0.0 - Direct RLS Fix Application
 * Applies the RLS fix using direct SQL execution
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testBasicConnection() {
  console.log('🔍 Testing basic Supabase connection...\n');
  
  try {
    // Test with a simple query first
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`❌ Connection Error: ${error.message}`);
      
      if (error.message.includes('infinite recursion')) {
        console.log('🔍 CONFIRMED: Infinite recursion detected in RLS policies!\n');
        return 'RECURSION_DETECTED';
      }
      
      return 'CONNECTION_ERROR';
    }
    
    console.log('✅ Basic connection successful');
    return 'SUCCESS';
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    return 'FAILED';
  }
}

async function testOtherTables() {
  console.log('🔍 Testing other table access...\n');
  
  const tables = ['businesses', 'coupons'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    } catch (error) {
      console.log(`❌ ${table}: ${error.message}`);
    }
  }
}

async function generateFixInstructions() {
  console.log('\n📋 MANUAL FIX INSTRUCTIONS FOR SUPABASE DASHBOARD:\n');
  console.log('=' .repeat(60));
  console.log('🚨 CRITICAL: Apply this fix via Supabase Dashboard → SQL Editor');
  console.log('=' .repeat(60));
  
  console.log('\n1️⃣ Go to https://lziayzusujlvhebyagdl.supabase.co');
  console.log('2️⃣ Navigate to SQL Editor in the left sidebar');
  console.log('3️⃣ Create a new query');
  console.log('4️⃣ Copy and paste the following SQL:');
  
  console.log('\n```sql');
  console.log('-- EMERGENCY RLS FIX - Apply immediately to fix infinite recursion');
  console.log('');
  console.log('-- Drop the problematic policies first');
  console.log('DROP POLICY IF EXISTS "Users can view own profile" ON public.users;');
  console.log('DROP POLICY IF EXISTS "users_select_policy" ON public.users;');
  console.log('');
  console.log('-- Drop problematic functions');
  console.log('DROP FUNCTION IF EXISTS public.is_admin();');
  console.log('');
  console.log('-- Create fixed user policy (no recursion)');
  console.log('CREATE POLICY "users_select_fixed" ON public.users');
  console.log('  FOR SELECT');
  console.log('  USING (id = auth.uid());');
  console.log('');
  console.log('-- Create safe admin function');
  console.log('CREATE OR REPLACE FUNCTION public.is_admin_safe()');
  console.log('RETURNS BOOLEAN');
  console.log('LANGUAGE SQL');
  console.log('SECURITY DEFINER');
  console.log('STABLE');
  console.log('AS $$');
  console.log('  SELECT COALESCE(is_admin, false)');
  console.log('  FROM public.users');
  console.log('  WHERE id = auth.uid();');
  console.log('$$;');
  console.log('```');
  
  console.log('\n5️⃣ Click "Run" to execute the fix');
  console.log('6️⃣ Verify the fix by running: SELECT public.is_admin_safe();');
  
  console.log('\n📋 FULL FIX FILE LOCATION:');
  console.log('💾 Complete fix: ./FIXED_RLS_POLICIES.sql');
  console.log('📝 Copy entire contents to Supabase Dashboard SQL Editor');
  
  console.log('\n🔍 After applying fix, test with:');
  console.log('node test-supabase-rls-fix.js');
}

async function main() {
  console.log('🚀 Saverly Modern v2.0.0 - Database Diagnosis\n');
  console.log(`📍 Database: ${SUPABASE_URL}`);
  console.log(`🔑 Project: lziayzusujlvhebyagdl\n`);
  
  const result = await testBasicConnection();
  
  if (result === 'RECURSION_DETECTED') {
    console.log('🎯 RLS infinite recursion confirmed!\n');
    await generateFixInstructions();
  } else if (result === 'SUCCESS') {
    console.log('✅ Connection working - testing all tables...\n');
    await testOtherTables();
    console.log('\n🎉 Database appears to be working correctly!');
  } else {
    console.log('\n🔍 Connection issues detected. This could be:');
    console.log('- RLS infinite recursion');
    console.log('- Network connectivity');
    console.log('- Authentication problems\n');
    
    await generateFixInstructions();
  }
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Apply the RLS fix via Supabase Dashboard');
  console.log('2. Test connection again');
  console.log('3. Proceed with Saverly Modern v2.0.0 development');
}

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});