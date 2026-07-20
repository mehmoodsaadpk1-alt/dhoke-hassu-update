const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AppShell.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find and fix the broken AppButton tag
const lines = content.split('\n');

let fixStart = -1;
let fixEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<AppButton') && lines[i+1] && lines[i+1].includes('handleCreateComposerPost')) {
    fixStart = i;
  }
  if (fixStart !== -1 && lines[i].includes('</div>') && i > fixStart) {
    fixEnd = i;
    break;
  }
}

if (fixStart !== -1 && fixEnd !== -1) {
  console.log(`Found broken block at lines ${fixStart+1} to ${fixEnd+1}`);
  console.log('Lines to replace:');
  for (let i = fixStart; i <= fixEnd; i++) {
    console.log(`  ${i+1}: ${lines[i]}`);
  }

  const replacement = [
    '          <button',
    '            type="button"',
    '            onClick={handleCreateComposerPost}',
    "            className=\"px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50\"",
    '          >',
    "            {currentLanguage === 'en' ? 'Post' : '\u067e\u0648\u0633\u0679 \u06a9\u0631\u06cc\u06ba'}",
    '          </button>',
    '        </div>'
  ];

  lines.splice(fixStart, fixEnd - fixStart + 1, ...replacement);
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log('Fixed successfully!');
} else {
  console.log('AppButton block not found. fixStart=' + fixStart + ' fixEnd=' + fixEnd);
  // Show context around line 2954
  for (let i = 2950; i < 2965 && i < lines.length; i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
