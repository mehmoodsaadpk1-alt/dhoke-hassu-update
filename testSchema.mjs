import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL + '/rest/v1/?apikey=' + process.env.VITE_SUPABASE_ANON_KEY;

async function getOpenAPI() {
  const res = await fetch(url);
  const json = await res.json();
  console.log("TABLES:", Object.keys(json.definitions || {}));
}
getOpenAPI();
