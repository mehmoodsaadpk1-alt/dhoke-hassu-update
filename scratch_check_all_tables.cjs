const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const tables = [
  'profiles', 'posts', 'comments', 'jobs', 'job_applications',
  'properties', 'buy_sell_items', 'marketplace_items', 'item_reports',
  'businesses', 'services', 'alerts', 'events', 'deals',
  'groups', 'promotions', 'stories', 'ads'
];

async function checkAll() {
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table} read error:`, error ? error.message : "None");
    
    const { error: orderError } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1);
    console.log(`Table ${table} order by created_at error:`, orderError ? orderError.message : "None");
  }
}

checkAll();
