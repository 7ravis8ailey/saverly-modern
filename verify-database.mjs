
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lziayzusujlvhebyagdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'
);

async function verifySetup() {
  console.log('🧪 Verifying Saverly database setup...\n');
  
  // Create test user
  const testEmail = 'verify-' + Date.now() + '@test.com';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'test123456'
  });
  
  if (authError) {
    console.log('❌ Auth signup failed:', authError.message);
    return;
  }
  
  console.log('✅ Auth working - User created:', authData.user.id);
  
  // Check if user was added to users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();
  
  if (userData) {
    console.log('✅ User profile created automatically!');
    console.log('   Email:', userData.email);
    console.log('\n🎉 SUCCESS! Your database is properly connected!');
  } else {
    console.log('❌ User profile not created:', userError?.message);
    console.log('   The trigger might need adjustment');
  }
}

verifySetup().catch(console.error);
