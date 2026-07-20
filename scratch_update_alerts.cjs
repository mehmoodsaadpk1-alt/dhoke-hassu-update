const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables not found!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndUpdate() {
  const { data, error } = await supabase
    .from('alerts')
    .select('*');

  if (error) {
    console.error("Error fetching alerts:", error);
    return;
  }

  console.log(`Fetched ${data.length} alerts.`);
  for (const item of data) {
    console.log(`Alert ID: ${item.id}, Title: "${item.title}", relatedUpdates:`, JSON.stringify(item.relatedUpdates));
    
    // Check if status is Pending (either in relatedUpdates or not)
    let status = 'Pending';
    let updates = [];
    if (item.relatedUpdates) {
      if (Array.isArray(item.relatedUpdates)) {
        updates = item.relatedUpdates;
        status = 'Active'; // If it's an array, dbGetAlerts maps status to Active
      } else if (typeof item.relatedUpdates === 'object') {
        updates = item.relatedUpdates.updates || [];
        status = item.relatedUpdates.status || 'Pending';
      }
    }
    
    // If it's a mock alert (ID starts with 'a') and status is Pending, update it to Active
    if (item.id.startsWith('a') && status === 'Pending') {
      console.log(`Updating mock alert ${item.id} to Active...`);
      const updatedRelatedUpdates = {
        ...item.relatedUpdates,
        status: 'Active'
      };
      
      const { error: updateError } = await supabase
        .from('alerts')
        .update({ relatedUpdates: updatedRelatedUpdates })
        .eq('id', item.id);
        
      if (updateError) {
        console.error(`Failed to update alert ${item.id}:`, updateError);
      } else {
        console.log(`Successfully updated alert ${item.id}`);
      }
    }
  }
}

checkAndUpdate();
