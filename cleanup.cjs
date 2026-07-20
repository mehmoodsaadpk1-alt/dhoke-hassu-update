const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

let revertedFiles = [];
let revertCount = 0;

walk('C:/Users/sys/Desktop/dhoke hassu connect/src', function(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove ?. if preceded by toString(), toLowerCase(), toUpperCase(), etc.
    content = content.replace(/(toString\(\)|toLowerCase\(\)|toUpperCase\(\)|toISOString\(\)|toLocaleTimeString\(\)|toLocaleDateString\(\))\?\.(substring|slice|split|trim|charAt|toUpperCase|toLowerCase)/g, '$1.$2');
    
    // Remove ?. if preceded by a string literal ('...', "...", `...`)
    content = content.replace(/(['"`]\s*)\?\.(substring|slice|split|trim|charAt|toUpperCase|toLowerCase)/g, '$1.$2');

    // Remove ?. if preceded by a number or boolean literal
    content = content.replace(/((true|false|\d+)\s*)\?\.(substring|slice|split|trim|charAt|toUpperCase|toLowerCase)/g, '$1.$2');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        revertedFiles.push(filePath);
        revertCount++;
    }
});

console.log(`Reverted unnecessary optional chaining in ${revertCount} files:`);
revertedFiles.forEach(f => console.log(f));
