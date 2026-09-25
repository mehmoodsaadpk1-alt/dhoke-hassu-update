import fs from 'fs';
const file = 'src/components/ChatModule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the start of the broken array
const startStr = '// Default initial conversations to populate localStorage\n';
const startIndex = content.indexOf(startStr);

if (startIndex !== -1) {
  // Find the end of the array, which is ];
  const endIndex = content.indexOf('];\n', startIndex);
  if (endIndex !== -1) {
    const newContent = content.substring(0, startIndex + startStr.length) + 'const INITIAL_CONVERSATIONS: Conversation[] = [];\n' + content.substring(endIndex + 3);
    fs.writeFileSync(file, newContent);
    console.log('Fixed INITIAL_CONVERSATIONS');
  } else {
    console.log('Could not find end of array');
  }
} else {
  console.log('Could not find start of array');
}
