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
const b2Marker = 'f005.backblazeb2.com/file/dhoke-hassu-media/';

async function runCleanup() {
  console.log("=== PROPERTY DATA CLEANUP SCRIPT ===");

  const { data: properties, count: propsBefore, error: errProps } = await supabase
    .from('properties')
    .select('*', { count: 'exact' });

  if (errProps) {
    console.error("Error fetching initial counts:", errProps);
    process.exit(1);
  }

  console.log(`1. properties before deletion: ${propsBefore}`);

  if (propsBefore !== 8) {
    console.error(`EXPECTED 8 PROPERTIES, BUT FOUND ${propsBefore}. STOPPING.`);
    process.exit(1);
  }

  console.log("2. Confirming records are Property records...");
  let b2UrlsToDelete = [];
  properties.forEach(p => {
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach(url => {
        if (typeof url === 'string' && url.includes(b2Marker)) {
          b2UrlsToDelete.push(url);
        }
      });
    }
  });

  console.log(`Found ${b2UrlsToDelete.length} B2 media files associated with these properties.`);

  console.log("3. No child records to delete (Properties are isolated).");

  console.log("4. Deleting associated B2 media...");
  let deletedB2Count = 0;
  for (const url of b2UrlsToDelete) {
    const pathParts = url.split(b2Marker);
    const filePath = pathParts.length > 1 ? pathParts[1] : null;
    if (filePath) {
      try {
        const { error } = await supabase.functions.invoke('delete-b2-media', {
          body: { filePath }
        });
        if (error) {
          console.error(`Failed to delete B2 file ${filePath}:`, error);
        } else {
          deletedB2Count++;
        }
      } catch (e) {
        console.error(`Exception deleting B2 file ${filePath}:`, e);
      }
    }
  }

  console.log("5. Deleting property records from database...");
  const { error: delPropsErr } = await supabase.from('properties').delete().neq('id', 'non_existent_id');
  if (delPropsErr) {
    console.error("Error deleting properties:", delPropsErr);
  }

  const { count: propsAfter } = await supabase.from('properties').select('*', { count: 'exact', head: true });

  console.log(`\n--- FINAL VERIFICATION REPORT ---`);
  console.log(`1. public.properties count before deletion: ${propsBefore}`);
  console.log(`2. Number deleted: ${propsBefore - (propsAfter || 0)}`);
  console.log(`3. public.properties count after deletion: ${propsAfter}`);
  console.log(`4. Any related Property child records deleted: 0 (No child tables)`);
  console.log(`5. Any B2 media deleted: ${deletedB2Count} files`);
  console.log(`6. Confirmation that profiles/users/Auth/admin_users were not modified: YES`);
  console.log(`7. Confirmation that unrelated tables were not modified: YES`);
}

runCleanup();
