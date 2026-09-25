import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function runAudit() {
  console.log("=== PROPERTIES AUDIT ===");

  const { data: properties, error: errProperties } = await supabase.from('properties').select('*');
  if (errProperties) {
    console.error("Error fetching properties:", errProperties);
  } else {
    console.log(`Total Properties: ${properties.length}`);
    if (properties.length > 0) {
      console.log("Sample IDs:", properties.slice(0, 5).map(p => p.id).join(', '));
      const propertiesWithImages = properties.filter(p => p.images && p.images.length > 0);
      console.log(`Properties with images: ${propertiesWithImages.length}`);
    }
  }

  console.log("=== AUDIT COMPLETE ===");
}

runAudit();
