const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function fetchBusinesses() {
  const { data, error } = await supabase.from('businesses').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log("Businesses in DB:", JSON.stringify(data.map(b => ({ id: b.id, name: b.name })), null, 2));
}

fetchBusinesses();
