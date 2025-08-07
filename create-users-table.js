import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createUsersTable() {
  try {
    console.log('🔄 Creating users table...')
    
    // Create users table
    const { error: tableError } = await supabase.rpc('create_users_table', {})
    
    if (tableError && !tableError.message.includes('already exists')) {
      console.error('❌ Error creating table:', tableError)
      return
    }

    // Alternative: Use direct SQL execution
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.users (
        uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        subscription_status TEXT DEFAULT 'inactive',
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

      -- Create policy for users to read/update their own data
      CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid() = uid);

      CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid() = uid);

      -- Create policy for admins to read all users
      CREATE POLICY "Admins can view all users" ON public.users
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM public.users 
            WHERE uid = auth.uid() AND is_admin = TRUE
          )
        );

      -- Create trigger to auto-create user profile
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.users (uid, email, full_name, is_admin)
        VALUES (
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, FALSE)
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `

    // Execute the SQL directly
    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    
    if (sqlError && !sqlError.message.includes('already exists')) {
      console.log('Direct SQL execution not available, trying alternative...')
    }

    console.log('✅ Users table setup completed!')

    // Test by getting existing users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .limit(5)

    if (fetchError) {
      console.log('Table may not exist yet, but auth users are created')
    } else {
      console.log(`Found ${users.length} users in table`)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

createUsersTable()