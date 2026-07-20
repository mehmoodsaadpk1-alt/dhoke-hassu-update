const fs = require('fs');

const files = [
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/FollowListModal.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/OnlineIndicator.tsx'
];

files.forEach(p => {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    // Replace literal backslash+backtick with just backtick
    content = content.replace(/\\`/g, '`');
    // Replace literal backslash+dollar with just dollar
    content = content.replace(/\\\$/g, '$');
    fs.writeFileSync(p, content, 'utf8');
    console.log('Unescaped ' + p);
  }
});
