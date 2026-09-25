require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://gsbasllnpbojpfrztarv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey; // Just to avoid error, we know it will fail if not real SR. But wait, I'll just check the method return type using TS or docs.
const supabase = createClient(supabaseUrl, serviceRole);

console.log(supabase.auth.admin.generateLink.toString());
