const fs = require('fs');

function regexReplaceInFile(path, regex, newStr) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, newStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Regex patched " + path);
  }
}

// 2. ProfileModule.tsx
const profPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/ProfileModule.tsx';
regexReplaceInFile(profPath, /const \[countriesList, setCountriesList\] = useState<any\[\]>\(\[\]\);\n?/g, '');
regexReplaceInFile(profPath, /\/\/ Initialize and load countries\n\s*useEffect\(\(\) => \{\n\s*async function loadCountries\(\) \{\n.*?setCountriesList\(list\);\n\s*\}\n\s*loadCountries\(\);\n\s*\}, \[\]\);\n?/s, '');
// Also any remaining map over countriesList
regexReplaceInFile(profPath, /\{countriesList\.map\(\(country: any\) => \(\n\s*<option key=\{country\.id\} value=\{country\.id\}>\n\s*\{country\.name\}\n\s*<\/option>\n\s*\)\)\}/s, '');

// 3. SettingsModule.tsx
const setPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx';
regexReplaceInFile(setPath, /const \[countriesList, setCountriesList\] = useState<any\[\]>\(\[\]\);\n?/g, '');
regexReplaceInFile(setPath, /useEffect\(\(\) => \{\n\s*async function loadCountries\(\) \{\n.*?setCountriesList\(list\);\n\s*\}\n\s*loadCountries\(\);\n\s*\}, \[\]\);\n?/s, '');
regexReplaceInFile(setPath, /\{countriesList\.map\(\(country: any\) => \(\n\s*<option key=\{country\.id\} value=\{country\.id\}>\n\s*\{country\.name\}\n\s*<\/option>\n\s*\)\)\}/s, '');
