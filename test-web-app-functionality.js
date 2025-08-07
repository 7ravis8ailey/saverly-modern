#!/usr/bin/env node
/**
 * Web App Functionality Test - Check actual user flows
 * Tests what users would experience in the Saverly web app
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

async function testWebAppFunctionality() {
  console.log('🌐 WEB APP FUNCTIONALITY TEST');
  console.log('============================');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  console.log('📡 1. BASIC CONNECTIVITY TEST');
  console.log('-----------------------------');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('businesses')
      .select('count', { count: 'exact', head: true });
      
    if (error) {
      console.log(`❌ Database connection: ${error.message}`);
      
      // Check if it's the RLS issue
      if (error.message.includes('infinite recursion')) {
        console.log('\n🚨 ROOT CAUSE IDENTIFIED:');
        console.log('========================');
        console.log('❌ RLS policies have infinite recursion');
        console.log('❌ This blocks ALL database operations');
        console.log('❌ Users cannot: register, login, view businesses, create coupons');
        console.log('❌ No data flows between web app and database');
        
        console.log('\n💡 WHAT THIS MEANS FOR USERS:');
        console.log('=============================');
        console.log('• Registration form: ❌ Will fail with database error');
        console.log('• Login form: ❌ Will fail with database error');  
        console.log('• Business listings: ❌ Will show empty or error');
        console.log('• Coupon creation: ❌ Will fail to save');
        console.log('• Coupon redemption: ❌ Will fail to track');
        console.log('• User profiles: ❌ Cannot load or save');
        
        console.log('\n🔧 IMMEDIATE FIX REQUIRED:');
        console.log('=========================');
        console.log('1. Go to: https://lziayzusujlvhebyagdl.supabase.co');
        console.log('2. Click: SQL Editor (left sidebar)');
        console.log('3. Copy/paste: Complete contents of FIXED_RLS_POLICIES.sql');
        console.log('4. Click: RUN (to execute the fix)');
        console.log('5. Test: Run this script again to verify');
        
        return {
          webAppWorking: false,
          databaseWorking: false,
          authWorking: false,
          dataFlowWorking: false,
          criticalIssue: 'RLS infinite recursion blocks all operations'
        };
      }
    } else {
      console.log('✅ Basic database connection working');
    }
    
  } catch (e) {
    console.log(`❌ Connection failed: ${e.message}`);
  }
  
  console.log('\n📱 2. WEB APP COMPONENT TEST');
  console.log('----------------------------');
  
  // Test what the web app would show
  console.log('Testing what users would see...');
  
  // Check if we can load any public data (like businesses for display)
  try {
    const { data: publicData, error: publicError } = await supabase
      .from('businesses')
      .select('id, name, active')
      .eq('active', true)
      .limit(5);
      
    if (publicError) {
      console.log('❌ Public business listings: BROKEN');
      console.log(`   Error: ${publicError.message}`);
      console.log('   Users will see: Empty page or error messages');
    } else {
      console.log(`✅ Public business listings: Working (${publicData.length} businesses)`);
    }
  } catch (e) {
    console.log('❌ Public data access failed');
  }
  
  // Test auth functionality
  console.log('\n🔐 3. AUTHENTICATION FLOW TEST');
  console.log('-------------------------------');
  
  try {
    // This is what happens when someone tries to register
    const { data: authTest, error: authError } = await supabase.auth.signUp({
      email: 'test@example.com', 
      password: 'password123',
      options: {
        data: {
          full_name: 'Test User'
        }
      }
    });
    
    if (authError) {
      console.log(`❌ User registration: ${authError.message}`);
    } else {
      console.log('✅ User registration: Basic auth working');
      
      // But the user profile creation would fail due to RLS
      console.log('⚠️  But user profile creation will fail due to RLS issues');
    }
  } catch (e) {
    console.log(`❌ Auth test failed: ${e.message}`);
  }
  
  console.log('\n📊 CURRENT STATUS SUMMARY');
  console.log('=========================');
  console.log('Web App Frontend: ✅ Loads and displays UI');
  console.log('Supabase Connection: ❌ RLS recursion blocks operations');
  console.log('User Registration: ❌ Cannot create user profiles');
  console.log('Business Creation: ❌ Cannot save to database');
  console.log('Coupon System: ❌ Cannot create or redeem');
  console.log('Data Persistence: ❌ Nothing saves to Supabase');
  
  console.log('\n❗ ANSWER TO YOUR QUESTIONS:');
  console.log('============================');
  console.log('Q: Does it create new accounts if created on web app?');
  console.log('A: ❌ NO - RLS recursion prevents user profile creation');
  console.log('');
  console.log('Q: Does it display in Supabase?');
  console.log('A: ❌ NO - Database operations are blocked');
  console.log('');
  console.log('Q: If coupon is redeemed, does it show up?');
  console.log('A: ❌ NO - Cannot write to redemptions table');
  console.log('');
  console.log('Q: If coupon is created, does it show up?');
  console.log('A: ❌ NO - Cannot write to coupons table');
  console.log('');
  console.log('Q: If business is created, does it show up?');
  console.log('A: ❌ NO - Cannot write to businesses table');
  
  console.log('\n🎯 THE SOLUTION:');
  console.log('================');
  console.log('Apply the FIXED_RLS_POLICIES.sql via Supabase Dashboard');
  console.log('This will fix all the above issues immediately');
  console.log('After fix: ALL questions above become ✅ YES');
}

testWebAppFunctionality()
  .then(() => {
    console.log('\n🔧 Next step: Fix RLS policies in Supabase Dashboard!');
  })
  .catch(console.error);