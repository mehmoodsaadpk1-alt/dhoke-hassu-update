const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const sql = "ALTER TABLE public.story_reactions ADD COLUMN IF NOT EXISTS receiver_id UUID; ALTER TABLE public.story_replies ADD COLUMN IF NOT EXISTS receiver_id UUID; ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions; ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;";
supabase.rpc('exec_sql', { sql_query: sql }).then(res => console.log(res)).catch(e => console.error(e));
