import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testLogin() {
  try {
    console.log('🔄 Testing login credentials...')
    
    // Test non-subscriber login
    console.log('\n1. Testing non-subscriber login:')
    const { data: userData, error: userError } = await supabase.auth.signInWithPassword({
      email: 'test@saverly.test',
      password: 'testpass123'
    })
    
    if (userError) {
      console.error('❌ User login failed:', userError.message)
      console.error('Full error:', userError)
    } else {
      console.log('✅ User login successful!')
      console.log('User:', userData.user.email)
      console.log('Session ID:', userData.session.access_token.substring(0, 20) + '...')
      
      // Sign out
      await supabase.auth.signOut()
    }

    // Test admin login
    console.log('\n2. Testing admin login:')
    const { data: adminData, error: adminError } = await supabase.auth.signInWithPassword({
      email: 'admin@saverly.test',
      password: 'adminpass123'
    })
    
    if (adminError) {
      console.error('❌ Admin login failed:', adminError.message)
      console.error('Full error:', adminError)
    } else {
      console.log('✅ Admin login successful!')
      console.log('User:', adminData.user.email)
      console.log('Session ID:', adminData.session.access_token.substring(0, 20) + '...')
      
      // Sign out
      await supabase.auth.signOut()
    }

    // Try to create a fresh user if login fails
    if (userError && userError.message.includes('Invalid login credentials')) {
      console.log('\n3. Creating fresh test user...')
      
      // Use service role to create user
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
      
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: 'testuser@saverly.app',
        password: 'password123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test User Fresh'
        }
      })
      
      if (createError) {
        console.error('❌ Error creating fresh user:', createError.message)
      } else {
        console.log('✅ Fresh user created!')
        console.log('New credentials:')
        console.log('Email: testuser@saverly.app')
        console.log('Password: password123')
        
        // Test login with new user
        console.log('\n4. Testing fresh user login:')
        const { data: freshData, error: freshError } = await supabase.auth.signInWithPassword({
          email: 'testuser@saverly.app',
          password: 'password123'
        })
        
        if (freshError) {
          console.error('❌ Fresh user login failed:', freshError.message)
        } else {
          console.log('✅ Fresh user login successful!')
          console.log('Email:', freshData.user.email)
        }
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testLogin()