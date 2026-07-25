import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { dbGetPosts } from './src/utils/supabaseClient.js';

dotenv.config({path: './.env'});

async function check() {
  const posts = await dbGetPosts([], 'some_group_id');
  console.log('Posts:', posts);
}

check();
