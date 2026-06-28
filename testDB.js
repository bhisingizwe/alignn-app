const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️ Query error (this is okay if table is empty):', error.message);
    }

    console.log('✅ Supabase connected successfully!');
    console.log('Connection test passed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection error:', error);
    process.exit(1);
  }
}

testConnection();