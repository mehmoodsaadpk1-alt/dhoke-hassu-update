const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

let fixCount = 0;
let modifiedFiles = [];

walk('C:/Users/sys/Desktop/dhoke hassu connect/src', function(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Replace all unsafe string operations with optional chaining
    // Negative lookbehind (?<!\?) to ensure it's not already optional chained.
    content = content.replace(/(?<!\?)\.(substring|slice|split|trim|charAt|toUpperCase|toLowerCase)\(/g, '?.$1(');

    // 2. Add fallback for AppAvatar name props
    // We match name={something} and ensure it has a fallback.
    content = content.replace(/<AppAvatar[^>]*name=\{([^}]+)\}/g, (match, p1) => {
        if (p1.includes('??') || p1.includes('||') || p1.trim().match(/^['"`]/)) {
            return match; // Already has fallback or is a string literal
        }
        return match.replace(`name={${p1}}`, `name={${p1} ?? "Unknown User"}`);
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        modifiedFiles.push(filePath);
        fixCount++;
    }
});

console.log(`Modified ${fixCount} files.`);
modifiedFiles.forEach(f => console.log(f));
