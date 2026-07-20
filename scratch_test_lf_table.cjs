const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testSchema() {
  // Test if table exists
  const { data: tblData, error: tblErr } = await supabase.from('lost_found_images').select('*').limit(1);
  console.log("Table check error:", tblErr?.message);
  
  // Try to create the bucket
  try {
    const { data: bktData, error: bktErr } = await supabase.storage.createBucket('lost-found-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
    if (bktErr) {
      console.log("Bucket creation error:", bktErr.message);
    } else {
      console.log("Bucket created successfully or exists:", bktData);
    }
  } catch (err) {
    console.error("Bucket creation exception:", err);
  }
}

testSchema();
