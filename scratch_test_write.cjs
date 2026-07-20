const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testWrite() {
  const { data, error } = await supabase.from('businesses').upsert({
    id: 'test-bu-1',
    name: 'Test Business',
    category: 'Shops',
    status: 'Pending'
  });
  if (error) {
    console.error("UPSERT ERROR:", error.message);
  } else {
    console.log("UPSERT SUCCESS:", data);
  }
}

testWrite();
