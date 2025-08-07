import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCurrentLogin() {
  console.log('🔄 Testing with current login form setup...')
  
  try {
    // Test the exact same login that would happen in the app
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@saverly.test',
      password: 'testpass123'
    })
    
    if (error) {
      console.error('❌ Login failed:', error.message)
      
      // If login fails, let's check what users exist
      console.log('\n🔍 Checking existing users with service role...')
      const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
      
      const { data: userList, error: listError } = await adminSupabase.auth.admin.listUsers()
      
      if (listError) {
        console.error('❌ Could not list users:', listError.message)
      } else {
        console.log(`Found ${userList.users.length} users:`)
        userList.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (ID: ${user.id.substring(0, 8)}...)`)
          console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
          console.log(`   Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
          console.log('---')
        })
      }
      
      return
    }

    console.log('✅ Login successful!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
    console.log('Email confirmed:', data.user.email_confirmed_at ? 'Yes' : 'No')
    
    // Test getting user session (what the app does)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message)
    } else {
      console.log('✅ Session retrieved successfully')
      console.log('Session user:', sessionData.session?.user?.email)
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }
}

testCurrentLogin()