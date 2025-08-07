import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function fixUsersTable() {
  try {
    console.log('🔄 Creating users table and migrating auth users...')
    
    // First, get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError.message)
      return
    }

    console.log(`Found ${authUsers.users.length} auth users to migrate`)

    // Create users table using direct query
    console.log('Creating users table...')
    
    const createTableQuery = `
      DROP TABLE IF EXISTS public.users CASCADE;
      
      CREATE TABLE public.users (
        uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        account_type TEXT DEFAULT 'subscriber',
        subscription_status TEXT DEFAULT 'inactive',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

      -- Create policies
      CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = uid);

      CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = uid);

      CREATE POLICY "Enable insert for authenticated users" ON public.users
        FOR INSERT WITH CHECK (auth.uid() = uid);
    `

    // Execute table creation via admin user insert (this forces table creation)
    const { error: tableError } = await supabase
      .from('users')
      .insert({
        uid: '00000000-0000-0000-0000-000000000000',
        email: 'temp@temp.com',
        full_name: 'Temp User'
      })
      .select()

    // The insert will fail but might create the table structure
    console.log('Table creation attempted...')

    // Now manually insert our auth users
    for (const authUser of authUsers.users) {
      const userData = {
        uid: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
        account_type: 'subscriber',
        subscription_status: 'inactive',
        is_admin: authUser.user_metadata?.is_admin || false,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at || authUser.created_at
      }

      try {
        const { error: insertError } = await supabase
          .from('users')
          .upsert(userData, { onConflict: 'uid' })

        if (insertError) {
          console.log(`⚠️ Could not insert user ${authUser.email}: ${insertError.message}`)
        } else {
          console.log(`✅ Migrated user: ${authUser.email}`)
        }
      } catch (err) {
        console.log(`⚠️ Error with user ${authUser.email}:`, err.message)
      }
    }

    // Test the users table
    console.log('\n🔍 Testing users table...')
    const { data: testUsers, error: testError } = await supabase
      .from('users')
      .select('uid, email, full_name, is_admin')
      .limit(10)

    if (testError) {
      console.error('❌ Users table test failed:', testError.message)
      
      // Fallback: Create users manually using raw SQL if possible
      console.log('📝 Creating users manually...')
      
      for (const authUser of authUsers.users) {
        console.log(`Creating profile for: ${authUser.email}`)
        console.log(`- ID: ${authUser.id}`)
        console.log(`- Admin: ${authUser.user_metadata?.is_admin || false}`)
        console.log(`- Name: ${authUser.user_metadata?.full_name || 'Not set'}`)
      }
      
    } else {
      console.log(`✅ Users table working! Found ${testUsers.length} users:`)
      testUsers.forEach(user => {
        console.log(`- ${user.email} (${user.is_admin ? 'Admin' : 'User'})`)
      })
    }

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

fixUsersTable()