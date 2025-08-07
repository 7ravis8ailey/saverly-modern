import { supabase } from './supabase'

export async function testDatabaseConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true })
    
    if (healthError) {
      console.error('Database connection failed:', healthError)
      return { success: false, error: healthError.message }
    }
    
    console.log('✅ Database connection successful')
    console.log('📊 Users table exists with', healthCheck, 'records')
    
    // Test table schema
    const tables = ['users', 'businesses', 'coupons', 'redemptions']
    const tableTests = []
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          
        if (error) {
          tableTests.push({ table, status: 'missing', error: error.message })
        } else {
          tableTests.push({ table, status: 'exists' })
        }
      } catch (err) {
        tableTests.push({ table, status: 'error', error: err })
      }
    }
    
    console.log('📋 Table Status:', tableTests)
    
    return { 
      success: true, 
      tables: tableTests,
      allTablesExist: tableTests.every(t => t.status === 'exists')
    }
    
  } catch (error) {
    console.error('Database test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function seedInitialData() {
  try {
    console.log('🌱 Seeding initial data...')
    
    // Create sample business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert([
        {
          name: 'Sample Coffee Shop',
          description: 'Your friendly neighborhood coffee shop',
          category: 'Food & Beverage',
          address: '123 Main Street',
          city: 'Anytown',
          state: 'CA',
          zip_code: '12345',
          latitude: 37.7749,
          longitude: -122.4194,
          phone: '(555) 123-4567',
          email: 'info@samplecoffee.com',
          contact_name: 'John Smith'
        }
      ])
      .select()
    
    if (businessError) {
      console.error('Failed to create sample business:', businessError)
      return { success: false, error: businessError.message }
    }
    
    // Create sample coupon
    if (business && business[0]) {
      const { error: couponError } = await supabase
        .from('coupons')
        .insert([
          {
            business_uid: business[0].uid,
            title: '20% Off Your Next Coffee',
            description: 'Get 20% off any coffee drink. Valid for new customers only.',
            discount: '20% OFF',
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            active: true,
            usage_limit: 'one_time'
          }
        ])
      
      if (couponError) {
        console.error('Failed to create sample coupon:', couponError)
        return { success: false, error: couponError.message }
      }
    }
    
    console.log('✅ Sample data seeded successfully')
    return { success: true }
    
  } catch (error) {
    console.error('Seeding failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}