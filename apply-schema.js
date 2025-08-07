import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function applySchema() {
  try {
    console.log('🔄 Applying database schema...')
    
    // Create a test user first to verify connection
    const { data: testData, error: testError } = await supabase.auth.admin.createUser({
      email: 'test@saverly.test',
      password: 'testpass123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test User'
      }
    })
    
    if (testError) {
      console.error('❌ Error creating test user:', testError)
    } else {
      console.log('✅ Test user created successfully!')
      console.log('User ID:', testData.user.id)
      
      // Now we can provide login credentials
      console.log('\n🔑 Test User Credentials:')
      console.log('Email: test@saverly.test')
      console.log('Password: testpass123')
      console.log('User Type: Non-subscriber (no active subscription)')
    }

    // Create admin user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@saverly.test',
      password: 'adminpass123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User',
        is_admin: true
      }
    })
    
    if (adminError) {
      console.error('❌ Error creating admin user:', adminError)
    } else {
      console.log('✅ Admin user created successfully!')
      console.log('User ID:', adminData.user.id)
      
      console.log('\n🔑 Admin User Credentials:')
      console.log('Email: admin@saverly.test')
      console.log('Password: adminpass123')
      console.log('User Type: Admin (full access)')
    }

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

applySchema()