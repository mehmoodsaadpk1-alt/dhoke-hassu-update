import { createClient } from '@supabase/supabase-js'
const url = 'https://gsbasllnpbojpfrztarv.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzYmFzbGxucGJvanBmcnp0YXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3Mjk5ODcsImV4cCI6MjA5ODMwNTk4N30.wWOUYD41MtJWSAZifBb7thJb3cSsh7fr4iXMsORVA4M'
const supabase = createClient(url, key)
const { data, error } = await supabase.from('videos').select('*').limit(1)
console.log(Object.keys(data[0] || {}))
