import dotenv from 'dotenv';
dotenv.config({path: './.env'});
import { dbGetPosts } from './src/utils/supabaseClient.js';

async function test() {
  const posts = await dbGetPosts([]);
  console.log('Fetched posts count:', posts.length);
  if (posts.length > 0) {
    const post = posts[0];
    console.log('First post image:', post.image);
    console.log('First post images:', post.images);
    console.log('First post content:', post.content);
  }
}

test();
