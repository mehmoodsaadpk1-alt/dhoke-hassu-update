const fs = require('fs');
const files = [
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/AppShell.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/ProfileModule.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/App.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/types.ts'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Catch-all patterns
    content = content.replace(/.*countryId.*\n?/g, '');
    content = content.replace(/.*country_id.*\n?/g, '');
    content = content.replace(/.*countryName.*\n?/g, '');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log("Blanket patched " + file);
  }
});
