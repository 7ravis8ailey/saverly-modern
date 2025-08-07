import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgyNDg0NDcsImV4cCI6MjA1MzgyNDQ0N30.2UYIV5ejfR7gVJGkGGNjcvK9iSo6BpjXNcx2aSQwK_g'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUsers() {
  try {
    console.log('Checking existing users...')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('email, full_name, subscription_status, is_admin')
      .limit(10)
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }

    console.log('📋 Current users in database:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   Name: ${user.full_name || 'Not set'}`)
      console.log(`   Subscription: ${user.subscription_status || 'Not subscribed'}`)
      console.log(`   Admin: ${user.is_admin ? 'Yes' : 'No'}`)
      console.log('---')
    })

    // Check if we have any non-subscribers
    const nonSubscribers = users.filter(u => u.subscription_status !== 'active')
    console.log(`\n✅ Found ${nonSubscribers.length} non-subscriber accounts`)
    
    if (nonSubscribers.length > 0) {
      console.log('\n🔑 Non-subscriber login credentials:')
      nonSubscribers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`)
        console.log(`   Status: ${user.subscription_status || 'No subscription'}`)
      })
    }

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }
}

checkUsers()