const fs = require('fs');
const file = 'src/utils/supabaseClient.ts';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split(/\r?\n/);

// Remove lines 5210 to 5241 (index 5209 to 5240)
// Replace with the 2 missing lines
lines.splice(5209, 32, 'export const dbUpdatePage = async (pageData: any): Promise<boolean> => {', '  if (!isSupabaseConfigured) {');

fs.writeFileSync(file, lines.join('\n'));
console.log("Fixed file.");
