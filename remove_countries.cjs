const fs = require('fs');

const files = [
  'C:/Users/sys/Desktop/dhoke hassu connect/src/types.ts',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/locationService.ts',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/LocationSetupWizard.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/AppShell.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/ProfileModule.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/components/PageCreateForm.tsx',
  'C:/Users/sys/Desktop/dhoke hassu connect/src/App.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    if (file.endsWith('types.ts')) {
      content = content.replace(/  countryId\?: string;\n/g, '');
      content = content.replace(/  countryName\?: string;\n/g, '');
      content = content.replace(/export interface Country \{\n  id: string;\n  name: string;\n\}\n\n/g, '');
      content = content.replace(/  countryId: string;\n/g, '');
    }
    
    if (file.endsWith('locationService.ts')) {
      content = content.replace(/import \{ Country, Province, City \} from '\.\.\/types';/g, "import { Province, City } from '../types';");
      content = content.replace(/export const getCountries = async \(\): Promise<Country\[\]> => \{\n.*?catch \(err\) \{\n.*?return \[\];\n  \}\n\};\n\n/s, '');
      content = content.replace(/export const fetchCountries = async \(\) => \{\n.*?return \[\];\n\};\n\n/s, '');
      content = content.replace(/const \{ data, error \} = await supabase\n.*?\.from\('countries'\)\n.*?\.select\('\*'\)\n.*?\.order\('name', \{ ascending: true \}\);/s, 'const data: any[] = [];');
    }

    if (file.endsWith('supabaseClient.ts')) {
      content = content.replace(/export async function dbGetCountries.*?return \[\];\n\s*\}/s, '');
      content = content.replace(/import \{.*?Country.*?} from '\.\.\/types';/g, match => match.replace(/Country,?\s*/, ''));
    }

    if (file.endsWith('LocationSetupWizard.tsx')) {
      content = content.replace(/import \{ Country, Province, City \} from '\.\.\/types';/g, "import { Province, City } from '../types';");
      content = content.replace(/const \[countries, setCountries\] = useState<Country\[\]>\(\[\]\);/g, '');
      content = content.replace(/const \[selectedCountry, setSelectedCountry\] = useState<string>\(initialCountry || ''\);/g, '');
      content = content.replace(/selectedCountry, /g, '');
      content = content.replace(/countryId: selectedCountry,/g, '');
      content = content.replace(/dbGetCountries, /g, '');
      
      // Remove loadCountries effect completely
      content = content.replace(/useEffect\(\(\) => \{\n\s*async function loadCountries.*?\}, \[\]\);/s, '');
      
      // Remove the Country select dropdown block completely
      content = content.replace(/<div className="space-y-2">\n\s*<label className="block text-sm.*?<select\n\s*value=\{selectedCountry\}.*?<\/select>\n\s*<\/div>/s, '');
    }
    
    if (file.endsWith('AppShell.tsx')) {
      content = content.replace(/const \[countries, setCountries\] = useState<any\[\]>\(\[\]\);/g, '');
      content = content.replace(/const loadCountries = async \(\) => \{.*?\};\n/s, '');
      content = content.replace(/loadCountries\(\);/g, '');
      content = content.replace(/countries=\{countries\}/g, '');
      // Handle the props being passed around
    }

    if (file.endsWith('App.tsx')) {
       // Remove from initial load
       content = content.replace(/const loadCountries = async \(\) => \{.*?\};/s, '');
       content = content.replace(/await loadCountries\(\);/g, '');
    }

    fs.writeFileSync(file, content, 'utf8');
  }
});

console.log('Finished aggressive scrub of countries.');
