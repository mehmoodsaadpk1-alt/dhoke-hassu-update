
const fs = require('fs');
let content = fs.readFileSync('001_add_pages_and_groups.sql', 'utf8');
content = content.replace(/CREATE TABLE public\.groups [\s\S]*?\);/g, '-- CREATE TABLE public.groups is omitted because it is defined in supabase_schema.sql as having id TEXT.');
content = content.replace(/group_id UUID REFERENCES public\.groups\(id\)/g, 'group_id TEXT REFERENCES public.groups(id)');
fs.writeFileSync('001_add_pages_and_groups.sql', content);

