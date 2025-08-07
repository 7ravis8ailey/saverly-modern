import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0ODU5NjUsImV4cCI6MjA2OTA2MTk2NX0.zghVA_8Gijpk2L8iC5bRhD8SIrW6GmPJp-Q39ykYszc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key (first 20 chars):', supabaseKey.substring(0, 20) + '...')
    
    // Test basic connection - try auth.users instead of public.users
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      console.error('Full error:', error)
      
      // Check if it's specifically an API key issue
      if (error.message.includes('Invalid API key')) {
        console.log('\n🔍 API Key Analysis:')
        console.log('- URL looks correct for project lziayzusujlvhebyagdl')
        console.log('- Key format looks like a JWT token')
        console.log('- This might be an expired or incorrect anon key')
        console.log('\n💡 Suggestion: Check Supabase dashboard for current anon key')
      }
    } else {
      console.log('✅ Connection successful!')
      console.log('Response:', data)
    }

    // Test auth functionality
    console.log('\n🔄 Testing auth functions...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.error('❌ Auth test failed:', authError.message)
    } else {
      console.log('✅ Auth functions working')
      console.log('Current session:', authData.session ? 'Active' : 'None')
    }

  } catch (error) {
    console.error('❌ Test failed with exception:', error.message)
  }
}

testConnection()