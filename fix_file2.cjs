const fs = require('fs');
const file = 'src/utils/supabaseClient.ts';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split(/\r?\n/);

// Remove lines 5210 to 5374
// Index is 5209 to 5373. Length is 5374 - 5210 + 1 = 165
lines.splice(5209, 165);

fs.writeFileSync(file, lines.join('\n'));
console.log("Removed duplicated block.");
