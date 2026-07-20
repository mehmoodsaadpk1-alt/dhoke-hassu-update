const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkEvents() {
  const { data, error } = await supabase.from('events').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log("Events in live DB:", JSON.stringify(data.map(e => ({ id: e.id, title: e.title })), null, 2));
}

checkEvents();
