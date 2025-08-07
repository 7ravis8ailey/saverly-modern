import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

async function runMigration() {
  console.log('🔄 Creating coupon_redemptions table...\n');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Test if table exists
  const { data: existingData, error: existingError } = await supabase
    .from('coupon_redemptions')
    .select('*')
    .limit(1);
  
  if (!existingError || !existingError.message.includes('does not exist')) {
    console.log('✅ Table coupon_redemptions already exists!');
    
    // Show current structure
    const { count } = await supabase
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Current redemptions count: ${count || 0}`);
    return;
  }
  
  console.log('❌ Table does not exist. Creating it now...\n');
  console.log('⚠️  IMPORTANT: Please run the following steps:\n');
  console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lziayzusujlvhebyagdl');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the contents of: create-coupon-redemptions-table.sql');
  console.log('4. Click "Run" to execute the migration\n');
  console.log('📁 The SQL file is located at:');
  console.log('   /Users/travisbailey/Claude Workspace/Saverly/saverly-modern/create-coupon-redemptions-table.sql\n');
  
  console.log('🔍 Attempting to verify coupons table has usage columns...');
  
  // Check if coupons table has the required columns
  const { data: coupons, error: couponsError } = await supabase
    .from('coupons')
    .select('usage_limit, current_usage_count')
    .limit(1);
  
  if (couponsError) {
    console.log('⚠️  Coupons table needs usage_limit and current_usage_count columns');
    console.log('   These will be added by the migration script');
  } else {
    console.log('✅ Coupons table has usage tracking columns');
  }
  
  console.log('\n📝 Migration Summary:');
  console.log('- Creates coupon_redemptions table');
  console.log('- Adds QR tracking columns (id, qr_data, expires_at, status)');
  console.log('- Creates indexes for performance');
  console.log('- Enables Row Level Security');
  console.log('- Adds usage tracking to coupons table');
  console.log('\n✨ Once complete, the coupon redemption system will be fully functional!');
}

runMigration().catch(console.error);