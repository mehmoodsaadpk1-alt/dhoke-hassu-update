const fs = require('fs');

const file1 = fs.readFileSync('src/components/AppShell.tsx', 'utf-8').split('\n');
const file2 = fs.readFileSync('temp_src_upload/src/components/AppShell.tsx', 'utf-8').split('\n');

let diffCount = 0;
for (let i = 0; i < Math.max(file1.length, file2.length); i++) {
  if (file1[i] !== file2[i]) {
    console.log(`Line ${i + 1}:`);
    console.log(`src/AppShell.tsx: ${file1[i]}`);
    console.log(`temp/AppShell.tsx: ${file2[i]}`);
    console.log('---');
    diffCount++;
  }
}
console.log(`Total diffs: ${diffCount}`);
