const fs = require('fs');

function regexReplaceInFile(path, regex, newStr) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, newStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Regex patched " + path);
  }
}

// ProfileModule.tsx
const profPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/ProfileModule.tsx';
regexReplaceInFile(profPath, /const \[countriesList, setCountriesList\] = useState<Country\[\]>\(\[\]\);\n/g, '');
regexReplaceInFile(profPath, /\{countriesList\.map\(c => <option key=\{c\.id\} value=\{c\.id\}>\{c\.name\}<\/option>\)\}\n/g, '');
// For cases where it might use any instead of Country
regexReplaceInFile(profPath, /const \[countriesList, setCountriesList\] = useState<any\[\]>\(\[\]\);\n/g, '');
// Also remove the entire select dropdown block if there is a remaining empty one
regexReplaceInFile(profPath, /<option value="" disabled>\{currentLanguage === 'en' \? 'Select Country' : '.*?'\}<\/option>\n/g, '');

// SettingsModule.tsx
const setPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx';
regexReplaceInFile(setPath, /const \[countriesList, setCountriesList\] = useState<Country\[\]>\(\[\]\);\n/g, '');
regexReplaceInFile(setPath, /\{countriesList\.map\(c => <option key=\{c\.id\} value=\{c\.id\}>\{c\.name\}<\/option>\)\}\n/g, '');
regexReplaceInFile(setPath, /const \[countriesList, setCountriesList\] = useState<any\[\]>\(\[\]\);\n/g, '');
regexReplaceInFile(setPath, /<option value="" disabled>\{currentLanguage === 'en' \? 'Select Country' : '.*?'\}<\/option>\n/g, '');

