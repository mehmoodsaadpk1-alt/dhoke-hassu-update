const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AppShell.tsx');
let content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Look at line 3021 (0-indexed: 3020) and check what follows
// Need to add );  }; after the </div> at line 3021 (0-indexed 3020)
// and before const renderAddStoryModal at line 3024 (0-indexed 3023)

// Find the exact location
let insertAfterLine = -1;
for (let i = 3018; i < 3025; i++) {
  console.log((i+1) + ': ' + JSON.stringify(lines[i]));
  if (lines[i] && lines[i].trim() === '</div>' && i >= 3019) {
    insertAfterLine = i;
  }
}

console.log('\nWill insert after line:', insertAfterLine + 1);

if (insertAfterLine !== -1) {
  // Insert );  }; after that line
  lines.splice(insertAfterLine + 1, 0, '    );', '  };');
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  console.log('Fixed: inserted );  }; after line ' + (insertAfterLine+1));
  
  // Verify the fix
  const newLines = fs.readFileSync(filePath, 'utf-8').split('\n');
  for (let i = insertAfterLine - 1; i <= insertAfterLine + 5; i++) {
    console.log((i+1) + ': ' + newLines[i]);
  }
} else {
  console.log('ERROR: Could not find insertion point');
}
