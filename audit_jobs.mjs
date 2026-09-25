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
  console.log("=== JOBS AUDIT ===");

  // Count Jobs
  const { data: jobs, error: errJobs } = await supabase.from('jobs').select('*');
  if (errJobs) {
    console.error("Error fetching jobs:", errJobs);
  } else {
    console.log(`Total Jobs: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log("Sample Jobs IDs:", jobs.slice(0, 5).map(j => j.id).join(', '));
      // Check for related media (image)
      const jobsWithImage = jobs.filter(j => j.image && j.image.trim() !== '');
      console.log(`Jobs with an image: ${jobsWithImage.length}`);
      if (jobsWithImage.length > 0) {
        console.log("Sample image URLs:", jobsWithImage.slice(0, 3).map(j => j.image));
      }
    }
  }

  // Count Job Applications
  const { data: apps, error: errApps } = await supabase.from('job_applications').select('*');
  if (errApps) {
    console.error("Error fetching job applications:", errApps);
  } else {
    console.log(`Total Job Applications: ${apps.length}`);
    if (apps.length > 0) {
      console.log("Sample Application IDs:", apps.slice(0, 5).map(a => a.id).join(', '));
      // check for resumes (resumeName)
      const appsWithResume = apps.filter(a => a.resumeName && a.resumeName.trim() !== '');
      console.log(`Applications with resume attached: ${appsWithResume.length}`);
      if (appsWithResume.length > 0) {
          console.log("Sample resume names/urls:", appsWithResume.slice(0, 3).map(a => a.resumeName));
      }
    }
  }

  console.log("=== AUDIT COMPLETE ===");
}

runAudit();
