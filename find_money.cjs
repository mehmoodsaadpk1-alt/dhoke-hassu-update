const fs = require('fs');
const path = require('path');

function search(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(search(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        // Strip out template string variables like ${...} to avoid false positives
        const lineWithoutVars = line.replace(/\$\{[^}]+\}/g, 'VAR');
        
        // If there's still a $ left, it might be a literal $
        if (lineWithoutVars.includes('$')) {
          results.push(fullPath + ':' + (i+1) + ': ' + line.trim());
        }
      });
    }
  }
  return results;
}

const res = search('./src');
console.log(res.join('\n'));
