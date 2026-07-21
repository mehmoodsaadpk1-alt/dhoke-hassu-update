const url = "https://gsbasllnpbojpfrztarv.supabase.co/rest/v1/";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M";
const headers = { "apikey": key, "Authorization": `Bearer ${key}` };
async function run() {
  let res = await fetch(url + "profiles?select=user_id&limit=1", { headers });
  let data = await res.json();
  console.log("profiles sample:", data);

  res = await fetch(url + "weekly_analytics?select=*&limit=1", { headers });
  data = await res.json();
  console.log("weekly_analytics count:", data.length);

  res = await fetch(url + "monthly_analytics?select=*&limit=1", { headers });
  data = await res.json();
  console.log("monthly_analytics count:", data.length);
}
run();
