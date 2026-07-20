const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function deleteDummy() {
  const { data, error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', 'bu-user-1783528161728');
    
  if (error) {
    console.error(error);
  } else {
    console.log("Deleted bu-user-1783528161728 successfully:", data);
  }
}

deleteDummy();
