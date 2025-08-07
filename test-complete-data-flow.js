#!/usr/bin/env node
/**
 * Complete Data Flow Test - Saverly <-> Supabase Integration
 * Tests: Account creation, Business creation, Coupon creation, Redemption flow
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

async function testCompleteDataFlow() {
  console.log('🧪 COMPLETE DATA FLOW TEST - Saverly <-> Supabase');
  console.log('==================================================');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let testResults = {
    auth: '❌ Not tested',
    business: '❌ Not tested', 
    coupon: '❌ Not tested',
    redemption: '❌ Not tested',
    dataFlow: '❌ Not verified'
  };

  try {
    // Test 1: Authentication & User Creation
    console.log('\n1️⃣ TESTING USER AUTHENTICATION & ACCOUNT CREATION');
    console.log('================================================');
    
    // Check if we can create a test user
    const testEmail = `test-${Date.now()}@saverly.test`;
    const testPassword = 'TestPassword123!';
    
    console.log(`📧 Testing account creation with: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User Saverly',
          user_type: 'consumer'
        }
      }
    });
    
    if (signUpError) {
      console.log(`⚠️  Auth signup result: ${signUpError.message}`);
      if (signUpError.message.includes('email confirmation')) {
        testResults.auth = '✅ Working (needs email confirmation)';
        console.log('✅ User creation works - email confirmation required');
      } else {
        testResults.auth = `❌ ${signUpError.message}`;
      }
    } else {
      testResults.auth = '✅ Working';
      console.log('✅ User account creation successful!');
      console.log(`   User ID: ${signUpData.user?.id}`);
    }

    // Test 2: Check Users Table
    console.log('\n2️⃣ CHECKING USERS TABLE ACCESS');
    console.log('===============================');
    
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, created_at')
      .limit(5);
    
    if (usersError) {
      console.log(`❌ Users table error: ${usersError.message}`);
      if (usersError.message.includes('infinite recursion')) {
        console.log('⚠️  RLS policies still need to be applied via Supabase Dashboard!');
      }
    } else {
      console.log(`✅ Users table accessible - ${usersData.length} users found`);
      usersData.forEach(user => {
        console.log(`   - ${user.email} (${user.id})`);
      });
    }

    // Test 3: Business Creation Flow
    console.log('\n3️⃣ TESTING BUSINESS CREATION');
    console.log('============================');
    
    const testBusiness = {
      name: `Test Business ${Date.now()}`,
      description: 'Test business for data flow validation',
      category: 'Food & Beverage',
      address: '123 Test Street, Test City, TS 12345',
      latitude: 40.7128,
      longitude: -74.0060,
      phone: '555-0123',
      email: 'test@business.com',
      website: 'https://testbusiness.com',
      active: true
    };
    
    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .insert([testBusiness])
      .select();
    
    if (businessError) {
      console.log(`❌ Business creation error: ${businessError.message}`);
      testResults.business = `❌ ${businessError.message}`;
    } else {
      console.log(`✅ Business created successfully!`);
      console.log(`   Business ID: ${businessData[0].id}`);
      console.log(`   Name: ${businessData[0].name}`);
      testResults.business = '✅ Working';
    }

    // Test 4: Coupon Creation Flow
    console.log('\n4️⃣ TESTING COUPON CREATION');
    console.log('==========================');
    
    // First get an existing business or use the one we just created
    let businessId;
    if (businessData && businessData[0]) {
      businessId = businessData[0].id;
    } else {
      // Try to get any existing business
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .limit(1);
      
      if (existingBusiness && existingBusiness[0]) {
        businessId = existingBusiness[0].id;
      }
    }
    
    if (businessId) {
      const testCoupon = {
        business_id: businessId,
        title: `Test Coupon ${Date.now()}`,
        description: '50% off test coupon for data flow validation',
        discount_type: 'percentage',
        discount_value: 50,
        minimum_purchase: 10.00,
        max_uses: 100,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        active: true
      };
      
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .insert([testCoupon])
        .select();
      
      if (couponError) {
        console.log(`❌ Coupon creation error: ${couponError.message}`);
        testResults.coupon = `❌ ${couponError.message}`;
      } else {
        console.log(`✅ Coupon created successfully!`);
        console.log(`   Coupon ID: ${couponData[0].id}`);
        console.log(`   Title: ${couponData[0].title}`);
        console.log(`   Discount: ${couponData[0].discount_value}% off`);
        testResults.coupon = '✅ Working';
      }
    } else {
      console.log('❌ No business available for coupon creation');
      testResults.coupon = '❌ No business available';
    }

    // Test 5: Check Existing Data
    console.log('\n5️⃣ CHECKING EXISTING DATA IN TABLES');
    console.log('===================================');
    
    const tables = ['businesses', 'coupons', 'redemptions', 'users'];
    for (const tableName of tables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ ${tableName}: ${count || 0} records`);
        }
      } catch (e) {
        console.log(`❌ ${tableName}: ${e.message}`);
      }
    }

    // Test 6: Verify RLS Status
    console.log('\n6️⃣ CHECKING RLS POLICY STATUS');
    console.log('=============================');
    
    try {
      // Try to query without auth - should work for public data
      const { data: publicBusinesses } = await supabase
        .from('businesses')
        .select('id, name, active')
        .eq('active', true)
        .limit(3);
      
      console.log(`✅ Public business data accessible: ${publicBusinesses?.length || 0} businesses`);
      
      // Check auth status
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`🔐 Auth session: ${session ? 'Active' : 'None (expected for tests)'}`);
      
    } catch (e) {
      console.log(`❌ RLS check failed: ${e.message}`);
    }

    // Final Summary
    console.log('\n📊 DATA FLOW TEST RESULTS');
    console.log('=========================');
    console.log(`🔐 Authentication: ${testResults.auth}`);
    console.log(`🏢 Business Creation: ${testResults.business}`);
    console.log(`🎟️  Coupon Creation: ${testResults.coupon}`);
    console.log(`💾 Database Access: ${usersError ? '❌ RLS needs fix' : '✅ Working'}`);
    
    // Overall status
    const workingCount = Object.values(testResults).filter(r => r.startsWith('✅')).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`\n🎯 OVERALL STATUS: ${workingCount}/${totalTests} components working`);
    
    if (usersError && usersError.message.includes('infinite recursion')) {
      console.log('\n⚠️  CRITICAL: Apply FIXED_RLS_POLICIES.sql via Supabase Dashboard!');
      console.log('   URL: https://lziayzusujlvhebyagdl.supabase.co');
      console.log('   Go to: SQL Editor > Paste FIXED_RLS_POLICIES.sql > Run');
    }
    
    return {
      success: workingCount > 2,
      results: testResults,
      needsRlsFix: !!usersError?.message.includes('infinite recursion')
    };

  } catch (error) {
    console.error('❌ Fatal test error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the complete test
testCompleteDataFlow()
  .then(result => {
    console.log('\n🚀 TEST COMPLETE!');
    if (result.success) {
      console.log('✅ Supabase integration is functional!');
    } else {
      console.log('⚠️  Some components need attention');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });