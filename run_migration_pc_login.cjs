const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';

const sql = fs.readFileSync('012_add_approve_pc_login_rpc.sql', 'utf8');

fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': supabaseKey,
    'Authorization': 'Bearer ' + supabaseKey
  },
  body: JSON.stringify({ sql_query: sql })
})
.then(r => r.text())
.then(text => {
  console.log("Migration result:", text);
})
.catch(err => {
  console.error("Migration error:", err);
});
