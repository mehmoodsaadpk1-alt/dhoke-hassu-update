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

async function runCleanup() {
  console.log("=== JOBS CLEANUP SCRIPT ===");

  const { count: jobsBefore, error: errJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  const { count: appsBefore, error: errApps } = await supabase.from('job_applications').select('*', { count: 'exact', head: true });

  if (errJobs || errApps) {
    console.error("Error fetching initial counts:", errJobs, errApps);
    process.exit(1);
  }

  console.log(`Jobs before: ${jobsBefore}`);
  console.log(`Applications before: ${appsBefore}`);

  if (jobsBefore !== 8) {
    console.error(`EXPECTED 8 JOBS, BUT FOUND ${jobsBefore}. STOPPING.`);
    process.exit(1);
  }

  console.log("Deleting job applications...");
  // Even if 0, run delete to ensure no stragglers
  const { error: delAppsErr } = await supabase.from('job_applications').delete().neq('id', 'non_existent_id');
  if (delAppsErr) console.error("Error deleting applications:", delAppsErr);

  console.log("Deleting jobs...");
  const { error: delJobsErr } = await supabase.from('jobs').delete().neq('id', 'non_existent_id');
  if (delJobsErr) console.error("Error deleting jobs:", delJobsErr);

  const { count: jobsAfter } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
  const { count: appsAfter } = await supabase.from('job_applications').select('*', { count: 'exact', head: true });

  console.log(`Jobs deleted: ${jobsBefore - (jobsAfter || 0)}`);
  console.log(`Jobs remaining: ${jobsAfter}`);
  console.log(`Applications remaining: ${appsAfter}`);
  
  console.log("=== CLEANUP COMPLETE ===");
}

runCleanup();
