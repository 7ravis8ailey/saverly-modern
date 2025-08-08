import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdminUser() {
  console.log('🔐 Creating admin user properly...');

  try {
    // First, let me check current table structure
    const { data: existingData, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('📋 Current table check:', checkError ? checkError.message : 'Table accessible');
    
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@test.saverly',
      password: 'TestAdmin123\!',
      email_confirm: true
    });

    if (authError && \!authError.message.includes('already registered')) {
      console.error('❌ Auth creation failed:', authError.message);
      return;
    }
    
    let userId = authUser?.user?.id;
    if (\!userId) {
      // User might already exist, try to find them
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users.users.find(u => u.email === 'admin@test.saverly');
      userId = existing?.id;
    }

    if (userId) {
      console.log('✅ Auth user ready, ID:', userId);
      
      // Now create/update profile using correct schema
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .upsert({
          uid: userId, // Use the auth user ID as primary key
          auth_uid: userId,
          email: 'admin@test.saverly',
          full_name: 'Test Admin User',
          account_type: 'admin',
          is_admin: true,
          subscription_status: 'active',
          email_verified: true,
          profile_completed: true
        }, { onConflict: 'uid' });

      if (profileError) {
        console.error('❌ Profile error:', profileError.message);
        
        // Maybe the table structure is different, let's try with minimal fields
        const { error: minimalError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: 'admin@test.saverly',
            full_name: 'Test Admin User'
          });
          
        if (minimalError) {
          console.error('❌ Even minimal profile failed:', minimalError.message);
        } else {
          console.log('✅ Minimal profile created');
        }
      } else {
        console.log('✅ Full profile created successfully\!');
      }

      // Test login
      console.log('\n🧪 Testing admin login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'admin@test.saverly',
        password: 'TestAdmin123\!'
      });

      if (loginError) {
        console.error('❌ Login failed:', loginError.message);
      } else {
        console.log('✅ Login successful\!');
        await supabase.auth.signOut();
      }
    }

    console.log('\n🎯 ADMIN ACCOUNT READY:');
    console.log('Email: admin@test.saverly');
    console.log('Password: TestAdmin123\!');

  } catch (error) {
    console.error('💥 Unexpected error:', error.message);
  }
}

createAdminUser();
EOF < /dev/null