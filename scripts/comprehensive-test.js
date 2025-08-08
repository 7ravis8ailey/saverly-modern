#!/usr/bin/env node

/**
 * Comprehensive Saverly Testing Suite
 * Tests all features, API keys, and user types
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import fetch from 'node-fetch';
import chalk from 'chalk';
import ora from 'ora';

// Configuration
const CONFIG = {
  supabase: {
    url: 'https://lziayzusujlvhebyagdl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'
  },
  stripe: {
    publishableKey: 'pk_test_51QhXCD02ghiSs4BUndAbMANHphG6iq71buFRb4Mjc6VQdiJCXk5Y5qijKXykFzu80xoPUVFiZdFTLH5O6k2dlfmj00EK32tJqL',
    priceId: 'price_1QikZq02ghiSs4BURNiyD53v'
  },
  googleMaps: {
    apiKey: 'AIzaSyD7tG8B_Y851kIfPuLaJpX5Cnt8e5W7Gn8'
  },
  netlify: {
    url: 'https://saverly-web.netlify.app'
  }
};

// Test Results Tracker
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper functions
function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? chalk.green : status === 'fail' ? chalk.red : chalk.yellow;
  console.log(`${icon} ${color(name)} ${message ? `- ${message}` : ''}`);
  
  if (status === 'pass') testResults.passed.push(name);
  else if (status === 'fail') testResults.failed.push({ name, message });
  else testResults.warnings.push({ name, message });
}

// API Tests
async function testGoogleMapsAPI() {
  const spinner = ora('Testing Google Maps API...').start();
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=1600+Amphitheatre&key=${CONFIG.googleMaps.apiKey}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      spinner.succeed();
      logTest('Google Maps API', 'pass', 'Places API working');
    } else if (data.status === 'REQUEST_DENIED') {
      spinner.fail();
      logTest('Google Maps API', 'fail', `API key denied: ${data.error_message}`);
    } else {
      spinner.warn();
      logTest('Google Maps API', 'warning', `Status: ${data.status}`);
    }
  } catch (error) {
    spinner.fail();
    logTest('Google Maps API', 'fail', error.message);
  }
}

async function testStripeAPI() {
  const spinner = ora('Testing Stripe API...').start();
  try {
    // Test with fetch since we can't use secret key from client
    const response = await fetch('https://api.stripe.com/v1/payment_methods', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.stripe.publishableKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'type=card&card[number]=4242424242424242&card[exp_month]=12&card[exp_year]=2025&card[cvc]=123'
    });
    
    if (response.status === 200) {
      spinner.succeed();
      logTest('Stripe API', 'pass', 'Publishable key valid');
    } else {
      const data = await response.json();
      spinner.warn();
      logTest('Stripe API', 'warning', `May need dashboard config: ${data.error?.message || 'Check tokenization settings'}`);
    }
  } catch (error) {
    spinner.fail();
    logTest('Stripe API', 'fail', error.message);
  }
}

async function testSupabaseConnection() {
  const spinner = ora('Testing Supabase connection...').start();
  try {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (!error) {
      spinner.succeed();
      logTest('Supabase Connection', 'pass', 'Database accessible');
    } else {
      spinner.fail();
      logTest('Supabase Connection', 'fail', error.message);
    }
  } catch (error) {
    spinner.fail();
    logTest('Supabase Connection', 'fail', error.message);
  }
}

async function testSupabaseEdgeFunctions() {
  const spinner = ora('Testing Supabase Edge Functions...').start();
  try {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    
    // Test if Edge Functions are deployed
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { test: true }
    });
    
    if (!error || error.message.includes('Not authenticated')) {
      spinner.succeed();
      logTest('Edge Functions', 'pass', 'Functions deployed and responding');
    } else {
      spinner.warn();
      logTest('Edge Functions', 'warning', 'Functions may need deployment');
    }
  } catch (error) {
    spinner.fail();
    logTest('Edge Functions', 'fail', error.message);
  }
}

// Frontend Tests
async function testNetlifyDeployment() {
  const spinner = ora('Testing Netlify deployment...').start();
  try {
    const response = await fetch(CONFIG.netlify.url);
    
    if (response.status === 200) {
      const html = await response.text();
      
      // Check for React app
      if (html.includes('root') && html.includes('script')) {
        spinner.succeed();
        logTest('Netlify Deployment', 'pass', 'Site is live and serving React app');
      } else {
        spinner.warn();
        logTest('Netlify Deployment', 'warning', 'Site is live but content unexpected');
      }
    } else {
      spinner.fail();
      logTest('Netlify Deployment', 'fail', `HTTP ${response.status}`);
    }
  } catch (error) {
    spinner.fail();
    logTest('Netlify Deployment', 'fail', error.message);
  }
}

async function testAuthFlow() {
  const spinner = ora('Testing authentication flow...').start();
  try {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.anonKey);
    
    // Test sign up
    const email = `test-${Date.now()}@saverly.test`;
    const password = 'TestPassword123!';
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Test User',
          account_type: 'subscriber'
        }
      }
    });
    
    if (!signUpError) {
      // Test sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!signInError) {
        spinner.succeed();
        logTest('Authentication Flow', 'pass', 'Sign up and sign in working');
        
        // Clean up
        await supabase.auth.signOut();
      } else {
        spinner.warn();
        logTest('Authentication Flow', 'warning', 'Sign up works but sign in failed');
      }
    } else {
      spinner.fail();
      logTest('Authentication Flow', 'fail', signUpError.message);
    }
  } catch (error) {
    spinner.fail();
    logTest('Authentication Flow', 'fail', error.message);
  }
}

// Data Seeding
async function seedTestData() {
  const spinner = ora('Seeding test data...').start();
  try {
    const supabase = createClient(CONFIG.supabase.url, CONFIG.supabase.serviceRoleKey);
    
    // Create test businesses
    const businesses = [
      {
        id: 'biz-test-001',
        name: 'Test Coffee Shop',
        email: 'coffee@test.saverly',
        contact_name: 'John Test',
        category: 'Food & Beverage',
        address: '123 Test St',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
        description: 'Test coffee shop for QA'
      },
      {
        id: 'biz-test-002',
        name: 'Test Gym',
        email: 'gym@test.saverly',
        contact_name: 'Jane Test',
        category: 'Health & Wellness',
        address: '456 Test Ave',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94103',
        latitude: 37.7739,
        longitude: -122.4184,
        description: 'Test gym for QA'
      }
    ];
    
    for (const business of businesses) {
      const { error } = await supabase.from('businesses').upsert(business);
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    }
    
    // Create test coupons
    const coupons = [
      {
        id: 'coupon-test-001',
        business_id: 'biz-test-001',
        title: '20% Off Coffee',
        description: 'Test coupon for QA',
        discount: '20% off',
        code: 'TEST20',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 100,
        active: true
      },
      {
        id: 'coupon-test-002',
        business_id: 'biz-test-002',
        title: 'Free Trial Week',
        description: 'Test gym trial for QA',
        discount: '7 days free',
        code: 'TESTGYM7',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 50,
        active: true
      }
    ];
    
    for (const coupon of coupons) {
      const { error } = await supabase.from('coupons').upsert(coupon);
      if (error && !error.message.includes('duplicate')) {
        throw error;
      }
    }
    
    spinner.succeed();
    logTest('Test Data Seeding', 'pass', `Created ${businesses.length} businesses and ${coupons.length} coupons`);
  } catch (error) {
    spinner.fail();
    logTest('Test Data Seeding', 'fail', error.message);
  }
}

// User Flow Tests
async function testSubscriberFlow() {
  console.log(chalk.blue('\n📱 Testing Subscriber User Flow:'));
  
  const tests = [
    { name: 'Home page loads', endpoint: '/' },
    { name: 'Authentication page', endpoint: '/auth' },
    { name: 'Businesses page', endpoint: '/businesses' },
    { name: 'Coupons feed', endpoint: '/coupons' },
    { name: 'Profile page', endpoint: '/profile' }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${CONFIG.netlify.url}${test.endpoint}`);
      if (response.status === 200) {
        logTest(test.name, 'pass');
      } else {
        logTest(test.name, 'warning', `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, 'fail', error.message);
    }
  }
}

async function testAdminFlow() {
  console.log(chalk.blue('\n👨‍💼 Testing Admin User Flow:'));
  
  // Admin flow would need actual authentication
  logTest('Admin Dashboard', 'warning', 'Requires manual testing with admin credentials');
  logTest('Business Management', 'warning', 'Requires manual testing with admin credentials');
  logTest('Coupon Management', 'warning', 'Requires manual testing with admin credentials');
  logTest('User Management', 'warning', 'Requires manual testing with admin credentials');
}

// Feature Tests
async function testCouponRedemption() {
  console.log(chalk.blue('\n🎟️ Testing Coupon Redemption:'));
  
  logTest('QR Code Generation', 'warning', 'Requires manual testing in app');
  logTest('60-Second Timer', 'warning', 'Requires manual testing in app');
  logTest('Usage Tracking', 'warning', 'Requires database verification');
  logTest('Monthly Reset', 'warning', 'Requires cron job verification');
}

async function testGeolocation() {
  console.log(chalk.blue('\n📍 Testing Geolocation Features:'));
  
  logTest('Near Me Filter', 'warning', 'Requires browser geolocation API');
  logTest('Distance Calculation', 'warning', 'Requires manual testing with real locations');
  logTest('Map Integration', 'warning', 'Requires visual verification');
}

// Generate Test Report
function generateReport() {
  console.log(chalk.bold.blue('\n' + '='.repeat(60)));
  console.log(chalk.bold.blue('📊 COMPREHENSIVE TEST REPORT'));
  console.log(chalk.bold.blue('='.repeat(60)));
  
  console.log(chalk.green(`\n✅ Passed: ${testResults.passed.length} tests`));
  testResults.passed.forEach(test => {
    console.log(`   • ${test}`);
  });
  
  if (testResults.warnings.length > 0) {
    console.log(chalk.yellow(`\n⚠️  Warnings: ${testResults.warnings.length} tests`));
    testResults.warnings.forEach(({ name, message }) => {
      console.log(`   • ${name}: ${message}`);
    });
  }
  
  if (testResults.failed.length > 0) {
    console.log(chalk.red(`\n❌ Failed: ${testResults.failed.length} tests`));
    testResults.failed.forEach(({ name, message }) => {
      console.log(`   • ${name}: ${message}`);
    });
  }
  
  // Recommendations
  console.log(chalk.bold.blue('\n📝 RECOMMENDATIONS:'));
  
  const recommendations = [];
  
  if (testResults.failed.some(f => f.name.includes('Google Maps'))) {
    recommendations.push('• Enable billing in Google Cloud Console for Maps API');
  }
  
  if (testResults.warnings.some(w => w.name.includes('Stripe'))) {
    recommendations.push('• Check Stripe Dashboard tokenization settings');
    recommendations.push('• Verify webhook endpoint configuration');
  }
  
  if (testResults.warnings.some(w => w.name.includes('Edge Functions'))) {
    recommendations.push('• Deploy Edge Functions using: supabase functions deploy');
  }
  
  if (testResults.warnings.some(w => w.name.includes('Admin'))) {
    recommendations.push('• Create admin test account for comprehensive admin panel testing');
  }
  
  recommendations.push('• Perform manual testing of:');
  recommendations.push('  - Subscribe button with real Stripe test card (4242 4242 4242 4242)');
  recommendations.push('  - QR code redemption flow with countdown timer');
  recommendations.push('  - Geolocation "Near Me" feature');
  recommendations.push('  - Mobile responsive design on actual devices');
  
  recommendations.forEach(rec => console.log(chalk.cyan(rec)));
  
  // Test Credentials
  console.log(chalk.bold.blue('\n🔑 TEST CREDENTIALS:'));
  console.log(chalk.cyan('Admin Account:'));
  console.log('  Email: admin@saverly.test');
  console.log('  Password: (needs to be set manually)');
  console.log(chalk.cyan('\nSubscriber Accounts:'));
  console.log('  Active: subscriber.active@saverly.test');
  console.log('  Inactive: subscriber.inactive@saverly.test');
  console.log('  Password: (needs to be set manually)');
  console.log(chalk.cyan('\nStripe Test Card:'));
  console.log('  Number: 4242 4242 4242 4242');
  console.log('  Expiry: Any future date');
  console.log('  CVC: Any 3 digits');
  
  // Final Status
  const totalTests = testResults.passed.length + testResults.warnings.length + testResults.failed.length;
  const successRate = Math.round((testResults.passed.length / totalTests) * 100);
  
  console.log(chalk.bold.blue('\n' + '='.repeat(60)));
  console.log(chalk.bold(successRate >= 70 ? chalk.green : successRate >= 50 ? chalk.yellow : chalk.red)(
    `Overall Success Rate: ${successRate}%`
  ));
  console.log(chalk.bold.blue('='.repeat(60) + '\n'));
}

// Main Test Runner
async function runAllTests() {
  console.log(chalk.bold.blue('🚀 Starting Comprehensive Saverly Testing Suite\n'));
  
  // API Tests
  console.log(chalk.blue('🔌 Testing API Integrations:'));
  await testGoogleMapsAPI();
  await testStripeAPI();
  await testSupabaseConnection();
  await testSupabaseEdgeFunctions();
  
  // Deployment Tests
  console.log(chalk.blue('\n🌐 Testing Deployment:'));
  await testNetlifyDeployment();
  
  // Authentication Tests
  console.log(chalk.blue('\n🔐 Testing Authentication:'));
  await testAuthFlow();
  
  // Data Seeding
  console.log(chalk.blue('\n💾 Seeding Test Data:'));
  await seedTestData();
  
  // User Flow Tests
  await testSubscriberFlow();
  await testAdminFlow();
  
  // Feature Tests
  await testCouponRedemption();
  await testGeolocation();
  
  // Generate Report
  generateReport();
}

// Run tests
runAllTests().catch(console.error);