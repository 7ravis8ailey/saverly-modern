// Create comprehensive test data for Saverly
// Run with: node scripts/create-test-data.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createTestData() {
  console.log('🚀 Creating comprehensive test data for Saverly...\n');

  try {
    // 1. Create test businesses
    const businesses = [
      {
        id: 'biz-test-coffee-001',
        name: 'The Coffee Corner',
        email: 'coffee@test.saverly',
        contact_name: 'John Barista',
        phone: '(415) 555-0101',
        address: '100 Coffee Lane',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        category: 'Food & Beverage',
        description: 'Artisanal coffee shop serving locally roasted beans and fresh pastries',
        latitude: 37.7749,
        longitude: -122.4194
      },
      {
        id: 'biz-test-gym-002',
        name: 'FitLife Gym',
        email: 'gym@test.saverly',
        contact_name: 'Sarah Trainer',
        phone: '(415) 555-0102',
        address: '200 Fitness Ave',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94103',
        category: 'Health & Wellness',
        description: 'Modern gym with state-of-the-art equipment and personal training',
        latitude: 37.7739,
        longitude: -122.4184
      },
      {
        id: 'biz-test-pizza-003',
        name: 'Pizza Paradise',
        email: 'pizza@test.saverly',
        contact_name: 'Mario Chef',
        phone: '(415) 555-0103',
        address: '300 Pizza Plaza',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94104',
        category: 'Food & Beverage',
        description: 'Authentic Italian pizzeria with wood-fired ovens',
        latitude: 37.7759,
        longitude: -122.4174
      }
    ];

    console.log('Creating test businesses...');
    for (const business of businesses) {
      const { data, error } = await supabase
        .from('businesses')
        .upsert(business, { onConflict: 'id' });
      
      if (error) {
        console.log(`⚠️ Business ${business.name}: ${error.message}`);
      } else {
        console.log(`✅ Created business: ${business.name}`);
      }
    }

    // 2. Create test coupons
    const coupons = [
      {
        id: 'coupon-test-coffee-20',
        business_id: 'biz-test-coffee-001',
        title: '20% Off All Coffee Drinks',
        description: 'Enjoy 20% off any coffee drink, hot or cold. Perfect for your morning boost!',
        discount: '20% off',
        code: 'TESTCOFFEE20',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 100,
        used_count: 5,
        active: true
      },
      {
        id: 'coupon-test-gym-free',
        business_id: 'biz-test-gym-002',
        title: 'First Month Free',
        description: 'New members get their first month absolutely free! No commitment required.',
        discount: '100% off first month',
        code: 'TESTGYM30',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 25,
        used_count: 2,
        active: true
      },
      {
        id: 'coupon-test-pizza-5off',
        business_id: 'biz-test-pizza-003',
        title: '$5 Off Large Pizza',
        description: 'Save $5 on any large pizza. Dine-in, takeout, or delivery.',
        discount: '$5 off',
        code: 'TESTPIZZA5',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        usage_limit: 200,
        used_count: 15,
        active: true
      }
    ];

    console.log('\nCreating test coupons...');
    for (const coupon of coupons) {
      const { data, error } = await supabase
        .from('coupons')
        .upsert(coupon, { onConflict: 'id' });
      
      if (error) {
        console.log(`⚠️ Coupon ${coupon.title}: ${error.message}`);
      } else {
        console.log(`✅ Created coupon: ${coupon.title}`);
      }
    }

    // 3. Create test users with auth
    console.log('\nCreating test users...');
    
    // Admin user
    const { data: adminAuth, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@test.saverly',
      password: 'TestAdmin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
        account_type: 'admin'
      }
    });
    
    if (!adminError) {
      console.log('✅ Created admin user: admin@test.saverly');
      
      // Update user profile
      await supabase
        .from('users')
        .upsert({
          id: adminAuth.user.id,
          email: 'admin@test.saverly',
          full_name: 'Test Admin',
          account_type: 'admin',
          subscription_status: 'active'
        });
    } else {
      console.log(`⚠️ Admin user: ${adminError.message}`);
    }

    // Active subscriber
    const { data: subAuth, error: subError } = await supabase.auth.admin.createUser({
      email: 'subscriber@test.saverly',
      password: 'TestUser123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Active Test Subscriber',
        account_type: 'subscriber'
      }
    });
    
    if (!subError) {
      console.log('✅ Created subscriber user: subscriber@test.saverly');
      
      // Update user profile
      await supabase
        .from('users')
        .upsert({
          id: subAuth.user.id,
          email: 'subscriber@test.saverly',
          full_name: 'Active Test Subscriber',
          account_type: 'subscriber',
          subscription_status: 'active',
          address: '123 Test Street',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94102',
          latitude: 37.7749,
          longitude: -122.4194
        });
    } else {
      console.log(`⚠️ Subscriber user: ${subError.message}`);
    }

    // Inactive subscriber
    const { data: inactiveAuth, error: inactiveError } = await supabase.auth.admin.createUser({
      email: 'inactive@test.saverly',
      password: 'TestUser123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Inactive Test Subscriber',
        account_type: 'subscriber'
      }
    });
    
    if (!inactiveError) {
      console.log('✅ Created inactive user: inactive@test.saverly');
      
      // Update user profile
      await supabase
        .from('users')
        .upsert({
          id: inactiveAuth.user.id,
          email: 'inactive@test.saverly',
          full_name: 'Inactive Test Subscriber',
          account_type: 'subscriber',
          subscription_status: 'inactive',
          address: '456 Test Avenue',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94103',
          latitude: 37.7739,
          longitude: -122.4184
        });
    } else {
      console.log(`⚠️ Inactive user: ${inactiveError.message}`);
    }

    console.log('\n🎉 Test data creation completed!');
    console.log('\n📋 SUMMARY:');
    console.log('• 3 test businesses created');
    console.log('• 3 test coupons created');
    console.log('• 3 test users created (admin + 2 subscribers)');
    
    console.log('\n🔑 TEST ACCOUNTS:');
    console.log('Admin: admin@test.saverly / TestAdmin123!');
    console.log('Active Subscriber: subscriber@test.saverly / TestUser123!');
    console.log('Inactive Subscriber: inactive@test.saverly / TestUser123!');
    
    console.log('\n💳 STRIPE TEST CARD:');
    console.log('Number: 4242 4242 4242 4242');
    console.log('Expiry: Any future date');
    console.log('CVC: Any 3 digits');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();