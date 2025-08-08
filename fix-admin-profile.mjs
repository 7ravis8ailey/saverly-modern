import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔧 Fixing admin user profile...');

try {
  // Get the admin auth user
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminAuthUser = users.users.find(u => u.email === 'admin@test.saverly');
  
  if (!adminAuthUser) {
    console.log('❌ Admin user not found in auth. Creating...');
    
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
      process.exit(1);
    }
    console.log('✅ Admin auth user created!');
  } else {
    console.log('✅ Admin auth user exists:', adminAuthUser.id);
  }

  const adminId = adminAuthUser?.id || adminUser?.user?.id;

  // Check if profile exists in users table
  const { data: existingProfile } = await supabase
    .from('users')
    .select('*')
    .eq('uid', adminId)
    .single();

  if (existingProfile) {
    console.log('📝 Existing profile found, updating to ensure admin status...');
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        account_type: 'admin',
        full_name: 'Test Admin User',
        email: 'admin@test.saverly',
        updated_at: new Date().toISOString()
      })
      .eq('uid', adminId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
    } else {
      console.log('✅ Admin profile updated:', updatedProfile);
    }
  } else {
    console.log('🆕 Creating new profile in users table...');
    
    const { data: newProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        uid: adminId,
        auth_uid: adminId,
        email: 'admin@test.saverly',
        full_name: 'Test Admin User',
        account_type: 'admin',
        subscription_status: 'active', // Admin gets active status
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      console.error('Full error:', profileError);
    } else {
      console.log('✅ Admin profile created:', newProfile);
    }
  }

  console.log('\n🎯 Admin user should now work correctly!');
  console.log('📧 Email: admin@test.saverly');
  console.log('🔑 Password: TestAdmin123!');
  console.log('🏛️ Should redirect to /admin dashboard');

} catch (error) {
  console.error('💥 Unexpected error:', error);
}