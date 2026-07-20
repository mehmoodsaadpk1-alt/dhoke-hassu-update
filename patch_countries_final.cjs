const fs = require('fs');

function regexReplaceInFile(path, regex, newStr) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regex, newStr);
    fs.writeFileSync(path, content, 'utf8');
    console.log("Regex patched " + path);
  }
}

// 1. locationService.ts
const locPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/locationService.ts';
regexReplaceInFile(locPath, /export const STATIC_COUNTRIES.*?;/s, '');
regexReplaceInFile(locPath, /export async function dbGetCountries.*?\n\}/s, '');

// 2. ProfileModule.tsx
const profPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/ProfileModule.tsx';
regexReplaceInFile(profPath, /dbGetCountries,?\s*/g, '');
regexReplaceInFile(profPath, /const \[countriesList, setCountriesList\] = useState<any\[\]>\(\[\]\);/g, '');
regexReplaceInFile(profPath, /\/\/ Initialize and load locations\n\s*useEffect\(\(\) => \{\n\s*async function loadCountries\(\) \{\n.*?\n\s*loadCountries\(\);\n\s*\}, \[\]\);/s, '');
regexReplaceInFile(profPath, /<div className="space-y-2">\n\s*<label className="block text-sm font-bold.*?<select.*?value=\{editForm\.countryId\}.*?<\/select>\n\s*<\/div>/s, '');
regexReplaceInFile(profPath, /countryId: profileData\.countryId \|\| '',/g, '');
regexReplaceInFile(profPath, /countryId: '',/g, '');
regexReplaceInFile(profPath, /countryName: countriesList.*?\|\| '',/g, '');

// 3. SettingsModule.tsx
const setPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx';
regexReplaceInFile(setPath, /dbGetCountries,?\s*/g, '');
regexReplaceInFile(setPath, /const \[countriesList, setCountriesList\] = useState<any\[\]>\(\[\]\);/g, '');
regexReplaceInFile(setPath, /useEffect\(\(\) => \{\n\s*async function loadCountries\(\) \{\n.*?\n\s*loadCountries\(\);\n\s*\}, \[\]\);/s, '');
regexReplaceInFile(setPath, /<div className="space-y-2">\n\s*<label className="block text-sm font-bold.*?<select.*?value=\{editForm\.countryId\}.*?<\/select>\n\s*<\/div>/s, '');
regexReplaceInFile(setPath, /countryId: profileData\.countryId \|\| '',/g, '');
regexReplaceInFile(setPath, /countryId: '',/g, '');
regexReplaceInFile(setPath, /countryName: countriesList.*?\|\| '',/g, '');

// 4. LocationSetupWizard.tsx
const wizPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/LocationSetupWizard.tsx';
regexReplaceInFile(wizPath, /const countryList = .*?;/s, '');
regexReplaceInFile(wizPath, /setCountries\(.*?\);/s, '');
regexReplaceInFile(wizPath, /\{countries.*?\}/s, '');
