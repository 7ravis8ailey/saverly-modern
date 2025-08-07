import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A'

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createSubscriber() {
  try {
    console.log('🔄 Creating subscriber account...')
    
    // Create subscriber with active subscription status
    const { data: subscriberData, error: subscriberError } = await supabase.auth.admin.createUser({
      email: 'subscriber@saverly.test',
      password: 'subscriber123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Active Subscriber',
        subscription_status: 'active',
        is_admin: false
      }
    })
    
    if (subscriberError) {
      console.error('❌ Error creating subscriber:', subscriberError.message)
      return
    }

    console.log('✅ Subscriber created successfully!')
    console.log('User ID:', subscriberData.user.id)
    
    // Test login with new credentials
    console.log('\n🔄 Testing subscriber login...')
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'
    const anonSupabase = createClient(supabaseUrl, anonKey)
    
    const { data: loginData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: 'subscriber@saverly.test',
      password: 'subscriber123'
    })
    
    if (loginError) {
      console.error('❌ Subscriber login test failed:', loginError.message)
    } else {
      console.log('✅ Subscriber login successful!')
      console.log('Email:', loginData.user.email)
      console.log('Subscription Status:', loginData.user.user_metadata?.subscription_status)
      
      // Sign out after test
      await anonSupabase.auth.signOut()
    }

    console.log('\n🔑 Subscriber Login Credentials:')
    console.log('Email: subscriber@saverly.test')
    console.log('Password: subscriber123')
    console.log('User Type: Active Subscriber (can redeem coupons)')
    console.log('Expected Flow: Login → /dashboard → Can redeem coupons without subscription prompt')

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

createSubscriber()