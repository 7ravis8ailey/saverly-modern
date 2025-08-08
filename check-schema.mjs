import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lziayzusujlvhebyagdl.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6aWF5enVzdWpsdmhlYnlhZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ4NTk2NSwiZXhwIjoyMDY5MDYxOTY1fQ.dTS7UtQeJNgqVkcVOEOU_ENQR_ED8QsdYCKu_QW__4A';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 Checking users table schema...');

try {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else if (data && data[0]) {
    console.log('📋 Available columns:', Object.keys(data[0]));
  } else {
    console.log('📋 Table exists but is empty');
  }
} catch (error) {
  console.error('💥 Error:', error);
}
EOF < /dev/null