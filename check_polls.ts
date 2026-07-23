import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase.from('polls').select('*').limit(1);
  if (error) {
    console.error("Error fetching polls:", error);
  } else if (data && data.length > 0) {
    console.log("Columns in polls table:", Object.keys(data[0]));
    console.log("Sample row:", JSON.stringify(data[0], null, 2));
  } else {
    console.log("Polls table exists but is empty.");
    // Insert a dummy row to get the schema then rollback or delete? 
    // Wait, you can't get schema of empty table from select * limit 1.
    // Let's use RPC or just rest endpoint.
    
    // We can query the swagger api description from supabase rest!
    const res = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
    const swagger = await res.json();
    if (swagger && swagger.definitions && swagger.definitions.polls) {
      console.log("Swagger Polls Definition:", JSON.stringify(swagger.definitions.polls.properties, null, 2));
    } else {
      console.log("Could not find polls in swagger definitions.");
    }
  }
}

checkSchema();
