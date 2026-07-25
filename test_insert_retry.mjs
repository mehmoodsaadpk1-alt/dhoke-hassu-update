import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path: './.env'});
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  const payload = {
    // id omitted to trigger uuid generation
    user_id: '3957ab02-1ed5-4817-9b50-f96d1832110a',
    text_content: 'test',
    image_url: null,
    video_url: null,
    post_type: 'general',
    likes: 0,
    commentsCount: 0,
    comments: []
  };
  const { data, error } = await supabase.from('posts').upsert(payload, { onConflict: 'id' }).select();
  console.log('Upsert result:', data, error);
}

check();
