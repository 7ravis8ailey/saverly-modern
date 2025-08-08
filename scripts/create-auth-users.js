#!/usr/bin/env node

/**
 * Create test users with proper authentication
 * This script uses the service role key to create users directly in Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🔐 Creating test users with proper authentication...\n');

  try {
    // 1. Create Admin User
    console.log('Creating admin user...');
    
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@test.saverly',
      password: 'TestAdmin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin User',
        account_type: 'admin'
      }
    });

    if (adminError) {
      if (adminError.message.includes('already registered')) {
        console.log('⚠️ Admin user already exists, updating...');
        
        // Try to find and update existing user
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingAdmin = users.users.find(u => u.email === 'admin@test.saverly');
        
        if (existingAdmin) {
          await supabase.auth.admin.updateUserById(existingAdmin.id, {
            password: 'TestAdmin123!',
            user_metadata: {
              full_name: 'Test Admin User',
              account_type: 'admin'
            }
          });
          console.log('✅ Admin user updated');
        }
      } else {
        console.error('❌ Admin user creation failed:', adminError.message);
      }
    } else {
      console.log('✅ Admin user created successfully');
    }

    // 2. Create Active Subscriber
    console.log('\nCreating active subscriber...');
    
    const { data: subscriberUser, error: subscriberError } = await supabase.auth.admin.createUser({
      email: 'subscriber@test.saverly',
      password: 'TestUser123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Active Test Subscriber',
        account_type: 'subscriber'
      }
    });

    if (subscriberError) {
      if (subscriberError.message.includes('already registered')) {
        console.log('⚠️ Subscriber user already exists, updating...');
        
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingSubscriber = users.users.find(u => u.email === 'subscriber@test.saverly');
        
        if (existingSubscriber) {
          await supabase.auth.admin.updateUserById(existingSubscriber.id, {
            password: 'TestUser123!',
            user_metadata: {
              full_name: 'Active Test Subscriber',
              account_type: 'subscriber'
            }
          });
          console.log('✅ Subscriber user updated');
        }
      } else {
        console.error('❌ Subscriber user creation failed:', subscriberError.message);
      }
    } else {
      console.log('✅ Subscriber user created successfully');
    }

    // 3. Create Inactive Subscriber
    console.log('\nCreating inactive subscriber...');
    
    const { data: inactiveUser, error: inactiveError } = await supabase.auth.admin.createUser({
      email: 'inactive@test.saverly',
      password: 'TestUser123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Inactive Test Subscriber',
        account_type: 'subscriber'
      }
    });

    if (inactiveError) {
      if (inactiveError.message.includes('already registered')) {
        console.log('⚠️ Inactive user already exists, updating...');
        
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingInactive = users.users.find(u => u.email === 'inactive@test.saverly');
        
        if (existingInactive) {
          await supabase.auth.admin.updateUserById(existingInactive.id, {
            password: 'TestUser123!',
            user_metadata: {
              full_name: 'Inactive Test Subscriber',
              account_type: 'subscriber'
            }
          });
          console.log('✅ Inactive user updated');
        }
      } else {
        console.error('❌ Inactive user creation failed:', inactiveError.message);
      }
    } else {
      console.log('✅ Inactive user created successfully');
    }

    console.log('\n🎉 User creation completed!');
    console.log('\n🔑 TEST CREDENTIALS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 Admin Account:');
    console.log('   Email: admin@test.saverly');
    console.log('   Password: TestAdmin123!');
    console.log('');
    console.log('👤 Active Subscriber:');
    console.log('   Email: subscriber@test.saverly');
    console.log('   Password: TestUser123!');
    console.log('');
    console.log('😴 Inactive Subscriber:');
    console.log('   Email: inactive@test.saverly');
    console.log('   Password: TestUser123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 4. Test login for admin
    console.log('\n🧪 Testing admin login...');
    
    const { data: loginTest, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.saverly',
      password: 'TestAdmin123!'
    });
    
    if (loginError) {
      console.error('❌ Admin login test failed:', loginError.message);
    } else {
      console.log('✅ Admin login test successful');
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUsers()
    .then(() => {
      console.log('\n✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}