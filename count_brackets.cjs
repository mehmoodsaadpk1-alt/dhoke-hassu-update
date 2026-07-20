const fs = require('fs');
const content = fs.readFileSync('C:/Users/sys/Desktop/dhoke hassu connect/src/components/AppShell.tsx', 'utf8');

let openBraces = 0;
let openParens = 0;

for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') openBraces--;
  if (content[i] === '(') openParens++;
  if (content[i] === ')') openParens--;
}

console.log("Braces balance:", openBraces);
console.log("Parens balance:", openParens);
