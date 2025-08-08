import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔐 Creating correct admin user...');

try {
  // Get the admin auth user ID
  const { data: users } = await supabase.auth.admin.listUsers();
  const adminAuthUser = users.users.find(u => u.email === 'admin@test.saverly');
  
  if (!adminAuthUser) {
    console.log('❌ Admin auth user not found. Creating...');
    
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@test.saverly',
      password: 'TestAdmin123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin User'
      }
    });

    if (adminError) {
      console.error('❌ Error creating admin auth user:', adminError.message);
      process.exit(1);
    }
    console.log('✅ Admin auth user created!');
  }

  const adminId = adminAuthUser?.id || adminUser?.user?.id;
  console.log('👤 Admin auth ID:', adminId);

  // Check if profile exists in users table
  const { data: existingProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', adminId) // Use 'id' not 'uid'
    .single();

  if (existingProfile) {
    console.log('📝 Existing profile found, updating to admin status...');
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update({
        is_admin: true,
        user_role: 'admin',
        full_name: 'Test Admin User',
        email: 'admin@test.saverly',
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
    } else {
      console.log('✅ Admin profile updated!');
    }
  } else {
    console.log('🆕 Creating new admin profile...');
    
    const { data: newProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: adminId,
        email: 'admin@test.saverly',
        full_name: 'Test Admin User',
        is_admin: true,
        user_role: 'admin',
        subscription_status: 'active',
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      console.error('Full error:', profileError);
    } else {
      console.log('✅ Admin profile created successfully!');
      console.log('👤 Profile data:', newProfile);
    }
  }

  // Verify the profile exists and can be found
  const { data: verifyProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', adminId)
    .single();
    
  if (verifyProfile) {
    console.log('\n🎯 ✅ Verification successful!');
    console.log('📧 Email: admin@test.saverly');
    console.log('🔑 Password: TestAdmin123!');
    console.log('🏛️ is_admin:', verifyProfile.is_admin);
    console.log('👔 user_role:', verifyProfile.user_role);
    console.log('📍 Should now redirect to /admin dashboard!');
  } else {
    console.log('❌ Verification failed - profile not found');
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}