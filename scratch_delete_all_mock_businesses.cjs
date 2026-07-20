const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const idsToDelete = ['bu1', 'bu2', 'bu3', 'bu4', 'bu5', 'bu6', 'bu7', 'bu8'];

async function deleteMockBusinesses() {
  console.log("Deleting mock businesses from database...");
  for (const id of idsToDelete) {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);
    if (error) {
      console.error(`Failed to delete ${id}:`, error.message);
    } else {
      console.log(`Deleted ${id} successfully.`);
    }
  }
}

deleteMockBusinesses();
