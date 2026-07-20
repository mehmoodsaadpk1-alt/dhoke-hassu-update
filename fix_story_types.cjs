const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M';

const sql = `
ALTER TABLE public.story_views ALTER COLUMN story_id TYPE TEXT USING story_id::TEXT;
ALTER TABLE public.story_reactions ALTER COLUMN story_id TYPE TEXT USING story_id::TEXT;
ALTER TABLE public.story_replies ALTER COLUMN story_id TYPE TEXT USING story_id::TEXT;
ALTER TABLE public.story_highlight_items ALTER COLUMN story_id TYPE TEXT USING story_id::TEXT;
ALTER TABLE public.story_moderation ALTER COLUMN story_id TYPE TEXT USING story_id::TEXT;
`;

fetch('https://gsbasllnpbojpfrztarv.supabase.co/rest/v1/rpc/exec_sql', { 
  method: 'POST', 
  headers: { 
    'Content-Type': 'application/json', 
    'apikey': key, 
    'Authorization': 'Bearer ' + key 
  }, 
  body: JSON.stringify({ sql_query: sql }) 
})
.then(async r => {
  const text = await r.text();
  console.log('Status:', r.status);
  console.log('Response:', text);
})
.catch(console.error);
