const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lziayzusujlvhebyagdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'
);

async function checkTables() {
  console.log('🔍 Checking what tables exist in Supabase...\n');
  
  // Test different possible table names
  const tableTests = ['users', 'businesses', 'coupons', 'profiles', 'User', 'Business'];
  
  for (const table of tableTests) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(0);
      if (!error) {
        console.log('✅ Table exists:', table);
      } else {
        console.log('❌ Table missing:', table, '-', error.code);
      }
    } catch (err) {
      console.log('❌ Table error:', table, '-', err.message);
    }
  }
  
  // Test auth signup to see what happens
  console.log('\n🧪 Testing auth signup...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test-' + Date.now() + '@example.com',
    password: 'testpassword123'
  });
  
  console.log('Auth signup result:', { 
    userCreated: !!data.user, 
    userId: data.user?.id,
    error: error?.message || 'success' 
  });
  
  // Check if we can see any existing auth users
  console.log('\n👥 Checking existing auth users...');
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Current session:', !!session);
}

checkTables().catch(console.error);