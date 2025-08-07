import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lziayzusujlvhebyagdl.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

async function checkSchema() {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  console.log('🔍 Checking actual database schema...\n');
  
  // Check coupons table structure
  const { data: coupons, error } = await supabase
    .from('coupons')
    .select('*')
    .limit(1);
  
  if (!error && coupons && coupons[0]) {
    console.log('📋 ACTUAL COUPONS TABLE COLUMNS:');
    console.log('================================');
    Object.keys(coupons[0]).sort().forEach(col => {
      console.log(`- ${col}`);
    });
  } else if (error) {
    console.log('❌ Coupons table error:', error.message);
  }
  
  // Check users table structure  
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (!usersError && users?.[0]) {
    console.log('\n📋 ACTUAL USERS TABLE COLUMNS:');
    console.log('==============================');
    Object.keys(users[0]).sort().forEach(col => {
      console.log(`- ${col}`);
    });
  }
  
  // Check coupon_redemptions table
  const { data: redemptions, error: redemptionError } = await supabase
    .from('coupon_redemptions')
    .select('*')
    .limit(1);
  
  if (!redemptionError && redemptions?.[0]) {
    console.log('\n📋 ACTUAL COUPON_REDEMPTIONS TABLE COLUMNS:');
    console.log('==========================================');
    Object.keys(redemptions[0]).sort().forEach(col => {
      console.log(`- ${col}`);
    });
  } else if (redemptionError) {
    console.log('\n❌ Coupon redemptions error:', redemptionError.message);
  }
}

checkSchema().catch(console.error);