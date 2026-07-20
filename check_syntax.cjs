const parser = require('@babel/parser');
const fs = require('fs');

const code = fs.readFileSync('src/components/AppShell.tsx', 'utf-8');

try {
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx']
  });
  console.log("No syntax errors found.");
} catch (e) {
  console.error("Error at line " + e.loc.line + ", col " + e.loc.column);
  console.error(e.message);
  
  // print surrounding code
  const lines = code.split('\n');
  const start = Math.max(0, e.loc.line - 10);
  const end = Math.min(lines.length, e.loc.line + 10);
  for (let i = start; i < end; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
