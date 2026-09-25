import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runCleanup() {
  console.log("=== CLEANING MARKETPLACE / BUY SELL ===");
  
  // Table 1: buy_sell_items
  const { data: bsi, error: bsiErr } = await supabase.from('buy_sell_items').select('*');
  if (!bsiErr && bsi) {
    console.log(`Found ${bsi.length} records in buy_sell_items. Deleting...`);
    for (const item of bsi) {
      await supabase.from('buy_sell_items').delete().eq('id', item.id);
    }
  }

  // Table 2: marketplace_items
  const { data: mi, error: miErr } = await supabase.from('marketplace_items').select('*');
  if (!miErr && mi) {
    console.log(`Found ${mi.length} records in marketplace_items. Deleting...`);
    for (const item of mi) {
      await supabase.from('marketplace_items').delete().eq('id', item.id);
    }
  }

  console.log("Done.");
}

runCleanup();
