import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔍 Checking users table structure...');

try {
  // Try to get any existing users to see the table structure
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);

  if (usersError) {
    console.error('❌ Error querying users table:', usersError.message);
    console.error('This might mean the users table does not exist yet');
    
    // Let's try to see what tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
      
    if (tablesError) {
      console.log('📋 Cannot get table list, but let\'s try to create a minimal user record...');
      
      // Try creating with minimal fields
      const { data: minimal, error: minimalError } = await supabase
        .from('users')
        .insert({
          email: 'admin@test.saverly',
          full_name: 'Test Admin User'
        })
        .select()
        .single();
        
      if (minimalError) {
        console.error('❌ Minimal insert failed:', minimalError.message);
        console.error('Full error:', minimalError);
      } else {
        console.log('✅ Minimal user created:', minimal);
      }
    }
  } else {
    console.log('✅ Users table exists!');
    if (users.length > 0) {
      console.log('📝 Sample user structure:', Object.keys(users[0]));
      console.log('👤 Sample user data:', users[0]);
    } else {
      console.log('📋 Users table is empty');
      
      // Try to insert a simple admin user
      const adminId = '503247d0-7ba5-4eef-91c1-cde416e0b3a6'; // From previous output
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: adminId, // Try with 'id' field
          email: 'admin@test.saverly',
          full_name: 'Test Admin User'
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('❌ Insert with id failed:', insertError.message);
        
        // Try with uid field
        const { data: newUser2, error: insertError2 } = await supabase
          .from('users')
          .insert({
            uid: adminId, // Try with 'uid' field
            email: 'admin@test.saverly',
            full_name: 'Test Admin User'
          })
          .select()
          .single();
          
        if (insertError2) {
          console.error('❌ Insert with uid failed:', insertError2.message);
        } else {
          console.log('✅ User created with uid:', newUser2);
        }
      } else {
        console.log('✅ User created with id:', newUser);
      }
    }
  }

  // Also check if we can query businesses to see what that table looks like
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .limit(1);
    
  if (!bizError && businesses) {
    console.log('\n🏢 Businesses table exists with fields:', Object.keys(businesses[0] || {}));
  }

} catch (error) {
  console.error('💥 Unexpected error:', error);
}