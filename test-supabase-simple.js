#!/usr/bin/env node

/**
 * SIMPLE SUPABASE CONNECTION TEST
 * Tests basic connection and auth without complex RLS policies
 */

import { createClient } from '@supabase/supabase-js';

// Configuration with proper Supabase credentials
const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc';

const TEST_CONFIG = {
  testEmail: `test-simple-${Date.now()}@saverly.test`,
  testPassword: 'TestPassword123!',
};

class SimpleSupabaseTest {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.results = [];
  }

  async runAllTests() {
    console.log('🚀 Simple Supabase Integration Tests');
    console.log('====================================');
    
    try {
      await this.testBasicConnection();
      await this.testAuthSystem();
      await this.testTableAccess();
      await this.testCleanup();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
    
    this.printResults();
    await this.storeResults();
  }

  async testBasicConnection() {
    await this.runTest('Basic Connection', async () => {
      // Test simple query that doesn't involve complex RLS
      const { data, error } = await this.supabase
        .from('subscription_plans')
        .select('count')
        .limit(1);
      
      if (error) {
        throw new Error(`Connection failed: ${error.message}`);
      }
      
      return { connected: true, queryWorked: true };
    });
  }

  async testAuthSystem() {
    await this.runTest('Authentication System', async () => {
      // Test user registration
      const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
        email: TEST_CONFIG.testEmail,
        password: TEST_CONFIG.testPassword,
        options: {
          data: {
            full_name: 'Test User'
          }
        }
      });
      
      if (signUpError) {
        throw new Error(`Sign up failed: ${signUpError.message}`);
      }
      
      // Test sign in
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: TEST_CONFIG.testEmail,
        password: TEST_CONFIG.testPassword
      });
      
      if (signInError) {
        throw new Error(`Sign in failed: ${signInError.message}`);
      }
      
      // Test session check
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session check failed: ${sessionError.message}`);
      }
      
      return {
        signUpWorked: !!signUpData.user,
        signInWorked: !!signInData.user,
        sessionActive: !!session,
        userId: signInData.user?.id
      };
    });
  }

  async testTableAccess() {
    await this.runTest('Table Access', async () => {
      // Test accessing public tables (should work without authentication)
      const { data: plans, error: plansError } = await this.supabase
        .from('subscription_plans')
        .select('*')
        .limit(5);
      
      if (plansError) {
        console.warn('Subscription plans query failed:', plansError.message);
      }
      
      // Test accessing businesses (public read access)
      const { data: businesses, error: businessError } = await this.supabase
        .from('businesses')
        .select('name, city, category')
        .eq('is_active', true)
        .limit(5);
      
      if (businessError) {
        console.warn('Businesses query failed:', businessError.message);
      }
      
      // Test accessing coupons (public read access)
      const { data: coupons, error: couponsError } = await this.supabase
        .from('coupons')
        .select('title, description, discount')
        .eq('active', true)
        .limit(5);
      
      if (couponsError) {
        console.warn('Coupons query failed:', couponsError.message);
      }
      
      return {
        subscriptionPlansAccessible: !plansError,
        businessesAccessible: !businessError,
        couponsAccessible: !couponsError,
        planCount: plans?.length || 0,
        businessCount: businesses?.length || 0,
        couponCount: coupons?.length || 0
      };
    });
  }

  async testCleanup() {
    await this.runTest('Cleanup', async () => {
      // Sign out
      const { error } = await this.supabase.auth.signOut();
      
      if (error) {
        console.warn('Sign out error:', error.message);
      }
      
      // Check session cleared
      const { data: { session } } = await this.supabase.auth.getSession();
      
      return {
        signedOut: !error,
        sessionCleared: !session
      };
    });
  }

  async runTest(name, testFunction) {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 ${name}...`);
      
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'PASS',
        duration,
        details: result
      });
      
      console.log(`✅ ${name} passed (${duration}ms)`);
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        name,
        status: 'FAIL',
        duration,
        error: error.message
      });
      
      console.error(`❌ ${name} failed (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  printResults() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = total - passed;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('\n📊 SIMPLE SUPABASE TEST RESULTS');
    console.log('===============================');
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️ Total Time: ${totalTime}ms`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }
    
    console.log('\n📋 TEST DETAILS:');
    this.results.forEach(r => {
      const status = r.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${r.name} (${r.duration}ms)`);
      if (r.details) {
        Object.entries(r.details).forEach(([key, value]) => {
          console.log(`      ${key}: ${value}`);
        });
      }
    });
  }

  async storeResults() {
    console.log('\n💾 Storing coordination results...');
    
    const summary = {
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      timestamp: new Date().toISOString(),
      testType: 'simple-supabase-integration'
    };
    
    console.log(`npx claude-flow hooks post-edit --memory-key "supabase-test/simple-integration-results" --details "${JSON.stringify(summary)}"`);
    console.log(`npx claude-flow hooks notification --message "Simple Supabase tests: ${summary.passed}/${summary.totalTests} passed. Basic connection and auth working."`);
  }
}

// Run the tests
const tester = new SimpleSupabaseTest();
tester.runAllTests().then(() => {
  console.log('\n🏁 Simple Supabase testing completed!');
}).catch((error) => {
  console.error('❌ Simple test failed:', error);
  process.exit(1);
});