import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTables() {
  console.log('🚀 Setting up Saverly database tables...\n')

  try {
    // Step 1: Test connection and check existing tables
    console.log('🔄 Checking current database state...')
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'businesses', 'coupons', 'redemptions'])

    if (tableError) {
      console.log('ℹ️  Could not check existing tables (expected for new database)')
    } else {
      console.log('📋 Existing tables:', tables?.map(t => t.table_name) || [])
    }

    // Step 2: Create a simple function to execute SQL using admin capabilities
    console.log('\n🔄 Creating database tables using Supabase client...')

    // Test if we can create a simple table first
    console.log('🧪 Testing table creation permissions...')
    
    // Try to create users table using Supabase methods
    const { error: createError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (createError && createError.code === 'PGRST106') {
      console.log('✅ Database connection working, but tables need to be created')
      
      // Since we can't execute arbitrary SQL through the client,
      // let's use the SQL editor approach or create a different method
      console.log('\n📝 Database Schema Setup Required')
      console.log('==================================')
      console.log('')
      console.log('The Supabase JavaScript client cannot execute DDL (CREATE TABLE) statements.')
      console.log('Please use one of these methods to set up the database:')
      console.log('')
      console.log('METHOD 1: Supabase Dashboard SQL Editor')
      console.log('1. Go to: https://supabase.com/dashboard/project/lziayzusujlvhebyagdl/sql')
      console.log('2. Copy and paste the contents of supabase-schema.sql')
      console.log('3. Click "Run" to execute the schema')
      console.log('')
      console.log('METHOD 2: Command Line (if you have psql installed)')
      console.log('1. Install psql: brew install postgresql (macOS)')
      console.log('2. Run: psql "postgresql://postgres:[password]@db.lziayzusujlvhebyagdl.supabase.co:5432/postgres" -f supabase-schema.sql')
      console.log('')
      console.log('METHOD 3: Supabase CLI')
      console.log('1. Install: npm install -g supabase')
      console.log('2. Run: supabase db push')
      console.log('')
      
    } else if (!createError) {
      console.log('✅ Users table already exists')
      
      // Check all tables
      const tables = ['users', 'businesses', 'coupons', 'redemptions']
      for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
          console.log(`❌ Table '${table}' missing or inaccessible`)
        } else {
          console.log(`✅ Table '${table}' exists and accessible`)
        }
      }
    } else {
      console.error('❌ Database connection error:', createError)
    }

    // Step 3: Create sample admin and test users (these work with auth)
    console.log('\n👥 Creating test users...')
    
    // Create admin user
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@saverly.test',
      password: 'adminpass123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        is_admin: true
      }
    })

    if (adminError && !adminError.message.includes('already registered')) {
      console.error('❌ Error creating admin user:', adminError.message)
    } else {
      console.log('✅ Admin user ready')
      console.log('   Email: admin@saverly.test')
      console.log('   Password: adminpass123')
    }

    // Create test subscriber
    const { data: testUser, error: testError } = await supabase.auth.admin.createUser({
      email: 'user@saverly.test',
      password: 'userpass123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
      }
    })

    if (testError && !testError.message.includes('already registered')) {
      console.error('❌ Error creating test user:', testError.message)
    } else {
      console.log('✅ Test user ready')
      console.log('   Email: user@saverly.test')
      console.log('   Password: userpass123')
    }

    console.log('\n🎯 Next Steps:')
    console.log('1. Set up the database schema using the Supabase Dashboard SQL Editor')
    console.log('2. Copy supabase-schema.sql content and run it in the SQL editor')
    console.log('3. Test the application with the created users')
    console.log('4. Run: node create-sample-data.js (after tables are created)')

  } catch (error) {
    console.error('❌ Setup error:', error.message)
  }
}

createTables()