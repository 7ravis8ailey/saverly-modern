const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use service role key for admin operations
const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.O8YBQHtBR8g4NnRFb_tTKw3pfOHhJzs3jgKv2D4EAAM';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deploySchema() {
  console.log('🚀 Deploying Saverly Database Schema to Supabase...\n');

  try {
    // Read the complete setup SQL file
    const schemaPath = path.join(__dirname, 'SUPABASE_COMPLETE_SETUP.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.log('❌ Schema file not found, creating basic schema...');
      await createBasicSchema();
      return;
    }

    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded:', schemaSQL.length, 'characters');

    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log('📋 Found', statements.length, 'SQL statements to execute\n');

    // Execute statements one by one
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      try {
        console.log(`🔄 [${i + 1}/${statements.length}] Executing...`);
        const { data, error } = await supabase.rpc('exec_sql', { query: statement });
        
        if (error) {
          console.log('❌ Failed:', error.message.substring(0, 100) + '...');
          failed++;
        } else {
          console.log('✅ Success');
          successful++;
        }
      } catch (err) {
        console.log('❌ Error:', err.message.substring(0, 100) + '...');
        failed++;
      }

      // Add small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Schema deployment completed:');
    console.log('✅ Successful:', successful);
    console.log('❌ Failed:', failed);

    // Test the deployment
    await testDeployment();

  } catch (error) {
    console.error('💥 Deployment failed:', error.message);
    console.log('\n🔧 Trying basic schema creation...');
    await createBasicSchema();
  }
}

async function createBasicSchema() {
  console.log('🏗️  Creating basic schema with essential tables...\n');

  const basicTables = [
    `
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      phone TEXT,
      subscription_status TEXT DEFAULT 'inactive',
      is_admin BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS public.businesses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      latitude DECIMAL(10, 8),
      longitude DECIMAL(11, 8),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `,
    `
    CREATE TABLE IF NOT EXISTS public.coupons (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      business_id UUID REFERENCES public.businesses(id),
      title TEXT NOT NULL,
      description TEXT,
      discount_type TEXT DEFAULT 'percentage',
      discount_amount DECIMAL(10, 2),
      original_price DECIMAL(10, 2),
      discounted_price DECIMAL(10, 2),
      valid_from TIMESTAMPTZ DEFAULT NOW(),
      valid_until TIMESTAMPTZ,
      max_redemptions INTEGER DEFAULT 100,
      current_redemptions INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    `
  ];

  for (const sql of basicTables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      if (error) {
        console.log('❌ Table creation failed:', error.message);
      } else {
        console.log('✅ Table created successfully');
      }
    } catch (err) {
      console.log('⚠️  Trying direct query execution...');
      // Try direct query as fallback
      const { error } = await supabase.from('_').select().eq('sql', sql);
      console.log('Direct query result:', error?.message || 'unknown');
    }
  }

  await testDeployment();
}

async function testDeployment() {
  console.log('\n🧪 Testing schema deployment...');

  const testTables = ['users', 'businesses', 'coupons'];
  let tablesFound = 0;

  for (const table of testTables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(0);
      if (!error) {
        console.log('✅', table, 'table is accessible');
        tablesFound++;
      } else {
        console.log('❌', table, 'table issue:', error.code);
      }
    } catch (err) {
      console.log('❌', table, 'table error:', err.message);
    }
  }

  console.log('\n📊 Schema Status:');
  console.log(`Tables created: ${tablesFound}/${testTables.length}`);
  
  if (tablesFound === testTables.length) {
    console.log('🎉 Database schema is ready!');
    console.log('\n✅ Your Saverly app should now be able to:');
    console.log('   • Create user accounts');
    console.log('   • Store business data');
    console.log('   • Manage coupons');
    console.log('   • Handle authentication');
  } else {
    console.log('⚠️  Some tables missing. Please check Supabase dashboard.');
  }
}

// Run the deployment
deploySchema();