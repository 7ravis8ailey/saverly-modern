import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('📝 Updating user profiles...');

try {
  // Get all users
  const { data: users } = await supabase.auth.admin.listUsers();
  
  // Find admin user
  const adminUser = users.users.find(u => u.email === 'admin@test.saverly');
  if (adminUser) {
    console.log('🔧 Updating admin profile...');
    
    const { error: adminProfileError } = await supabase
      .from('users')
      .upsert({
        id: adminUser.id,
        email: adminUser.email,
        full_name: 'Test Admin User',
        account_type: 'admin',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (adminProfileError) {
      console.error('❌ Admin profile error:', adminProfileError.message);
    } else {
      console.log('✅ Admin profile updated');
    }
  }
  
  // Find subscriber user
  const subUser = users.users.find(u => u.email === 'subscriber@test.saverly');
  if (subUser) {
    console.log('🔧 Updating subscriber profile...');
    
    const { error: subProfileError } = await supabase
      .from('users')
      .upsert({
        id: subUser.id,
        email: subUser.email,
        full_name: 'Active Test Subscriber',
        account_type: 'subscriber',
        subscription_status: 'active',
        address: '123 Test Street',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (subProfileError) {
      console.error('❌ Subscriber profile error:', subProfileError.message);
    } else {
      console.log('✅ Subscriber profile updated');
    }
  }
  
  console.log('\n🎉 Profile updates completed!');
  console.log('\n🔑 WORKING TEST CREDENTIALS:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin Account:');
  console.log('   Email: admin@test.saverly');
  console.log('   Password: TestAdmin123!');
  console.log('   Type: admin');
  console.log('');
  console.log('👤 Active Subscriber:');
  console.log('   Email: subscriber@test.saverly');
  console.log('   Password: TestUser123!');
  console.log('   Type: subscriber');
  console.log('   Status: active');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

} catch (error) {
  console.error('💥 Error:', error);
}