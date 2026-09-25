const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  let count = 0;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      count += replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('PKR')) {
        // Replace PKR with Rs.
        const newContent = content.replace(/\bPKR\b/g, 'Rs.');
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent, 'utf8');
          console.log(`Updated: ${fullPath}`);
          count++;
        }
      }
    }
  }
  return count;
}

const total = replaceInDir('./src');
console.log(`\nReplaced in ${total} files.`);
