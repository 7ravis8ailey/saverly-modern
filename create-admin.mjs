import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔐 Creating admin test user...');

try {
  // Delete existing user if exists
  const { data: users } = await supabase.auth.admin.listUsers();
  const existingUser = users.users.find(u => u.email === 'admin@test.saverly');
  
  if (existingUser) {
    console.log('🗑️ Removing existing admin user...');
    await supabase.auth.admin.deleteUser(existingUser.id);
  }

  // Create new admin user
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
    console.error('❌ Error creating admin:', adminError.message);
  } else {
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@test.saverly');
    console.log('🔑 Password: TestAdmin123!');
    
    // Test login
    console.log('\n🧪 Testing login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.saverly',
      password: 'TestAdmin123!'
    });
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message);
    } else {
      console.log('✅ Login successful!');
      console.log('👤 User ID:', loginData.user.id);
      await supabase.auth.signOut();
    }
  }

  // Create subscriber user
  console.log('\n👤 Creating subscriber test user...');
  
  const existingSub = users.users.find(u => u.email === 'subscriber@test.saverly');
  if (existingSub) {
    await supabase.auth.admin.deleteUser(existingSub.id);
  }

  const { data: subUser, error: subError } = await supabase.auth.admin.createUser({
    email: 'subscriber@test.saverly',
    password: 'TestUser123!',
    email_confirm: true,
    user_metadata: {
      full_name: 'Active Test Subscriber',
      account_type: 'subscriber'
    }
  });

  if (subError) {
    console.error('❌ Error creating subscriber:', subError.message);
  } else {
    console.log('✅ Subscriber user created successfully!');
    console.log('📧 Email: subscriber@test.saverly');
    console.log('🔑 Password: TestUser123!');
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}