const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function activateAll() {
  const { data, error } = await supabase.from('alerts').select('*');
  if (error) {
    console.error(error);
    return;
  }
  
  console.log(`Activating all ${data.length} alerts...`);
  for (const item of data) {
    const updatedRelatedUpdates = {
      ...item.relatedUpdates,
      status: 'Active',
      expiryTime: undefined // Remove expiry so it never expires for testing
    };
    
    const { error: updateError } = await supabase
      .from('alerts')
      .update({ relatedUpdates: updatedRelatedUpdates })
      .eq('id', item.id);
      
    if (updateError) {
      console.error(`Failed to update ${item.id}:`, updateError.message);
    } else {
      console.log(`Updated ${item.id} successfully.`);
    }
  }
}

activateAll();
