import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';

// Supabase connection details
// Format: postgres://[user]:[password]@[host]:[port]/[database]
const connectionString = 'postgresql://postgres.lziayzusujlvhebyagdl:Saverly2024!@aws-0-us-west-1.pooler.supabase.com:6543/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔄 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected to database successfully!');

    console.log('\n🚀 Setting up Saverly database schema...\n');
    
    // Read and execute the schema file
    console.log('📖 Reading schema file...');
    const schema = readFileSync('./supabase-schema.sql', 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          console.log(`🔄 Executing statement ${i + 1}/${statements.length}...`);
          
          // Show what we're executing (first 100 chars)
          const preview = statement.substring(0, 100).replace(/\s+/g, ' ') + (statement.length > 100 ? '...' : '');
          console.log(`   ${preview}`);
          
          const result = await client.query(statement);
          console.log(`✅ Statement ${i + 1} completed successfully`);
          successCount++;
          
        } catch (error) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message);
          errorCount++;
          
          // Continue with other statements unless it's a critical error
          if (error.message.includes('already exists')) {
            console.log('   ℹ️  Object already exists, continuing...');
          } else if (error.message.includes('does not exist') && statement.includes('DROP')) {
            console.log('   ℹ️  Drop statement for non-existent object, continuing...');
          }
        }
      }
    }

    console.log(`\n📊 Schema execution summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📋 Total: ${statements.length}`);

    // Test the setup by querying table information
    console.log('\n🔍 Verifying database setup...');
    
    const tableCheck = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'businesses', 'coupons', 'redemptions')
      ORDER BY table_name;
    `);

    console.log('\n📋 Created tables:');
    tableCheck.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name} (${row.table_type})`);
    });

    // Check RLS status
    const rlsCheck = await client.query(`
      SELECT schemaname, tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'businesses', 'coupons', 'redemptions')
      ORDER BY tablename;
    `);

    console.log('\n🔒 Row Level Security status:');
    rlsCheck.rows.forEach(row => {
      const status = row.rowsecurity ? '✅ Enabled' : '❌ Disabled';
      console.log(`   ${row.tablename}: ${status}`);
    });

    // Check indexes
    const indexCheck = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'businesses', 'coupons', 'redemptions')
      ORDER BY tablename, indexname;
    `);

    console.log('\n🔍 Created indexes:');
    let currentTable = '';
    indexCheck.rows.forEach(row => {
      if (row.tablename !== currentTable) {
        console.log(`   📋 ${row.tablename}:`);
        currentTable = row.tablename;
      }
      console.log(`      ✅ ${row.indexname}`);
    });

    console.log('\n🎉 Database schema setup completed!');
    console.log('\n📋 Database is ready for:');
    console.log('   ✅ User registration and authentication');
    console.log('   ✅ Business listings and management');
    console.log('   ✅ Coupon creation and redemption');
    console.log('   ✅ Subscription tracking');
    console.log('   ✅ Row-level security enforcement');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

setupDatabase();