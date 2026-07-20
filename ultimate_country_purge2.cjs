const fs = require('fs');

function scrub(path, callback) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    let newContent = callback(content);
    if (content !== newContent) {
      fs.writeFileSync(path, newContent, 'utf8');
      console.log("Scrubbed " + path);
    }
  }
}

// 1. types.ts
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/types.ts', c => {
  c = c.replace(/  countryId\??: string;\n/g, '');
  c = c.replace(/  countryName\?: string;\n/g, '');
  c = c.replace(/export interface Country \{\n  id: string;\n  name: string;\n\}\n/g, '');
  return c;
});

// 2. locationService.ts
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/utils/locationService.ts', c => {
  c = c.replace(/import \{ Country, Province, City, Area \} from '\.\.\/types';/, "import { Province, City, Area } from '../types';");
  c = c.replace(/, countryId: 'country-pk-1' /g, '');
  
  const oldProv = /export async function dbGetProvinces\(countryId: string\): Promise<Province\[\]> \{\n.*?\}\n\}/s;
  const newProv = "export async function dbGetProvinces(): Promise<Province[]> {\n" +
  "  if (!isSupabaseConfigured || !supabase) {\n" +
  "    return STATIC_PROVINCES;\n" +
  "  }\n" +
  "  try {\n" +
  "    const { data, error } = await supabase\n" +
  "      .from('provinces')\n" +
  "      .select('*')\n" +
  "      .order('name');\n" +
  "    if (error) throw error;\n" +
  "    return data && data.length > 0 ? data.map((p: any) => ({\n" +
  "      id: p.id,\n" +
  "      name: p.name\n" +
  "    })) : STATIC_PROVINCES;\n" +
  "  } catch (err) {\n" +
  "    console.warn('dbGetProvinces failed, using local fallback databases:', err);\n" +
  "    return STATIC_PROVINCES;\n" +
  "  }\n" +
  "}";
  c = c.replace(oldProv, newProv);
  return c;
});

// 3. supabaseClient.ts
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/utils/supabaseClient.ts', c => {
  c = c.replace(/countryId: data\.country_id \|\| null,\n/g, '');
  c = c.replace(/countryId: profileData\.country_id \|\| '',\n/g, '');
  c = c.replace(/country_id: profileData\.countryId,\n/g, '');
  return c;
});

// 4. App.tsx
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/App.tsx', c => {
  c = c.replace(/countryId: profile\.country_id,\n/g, '');
  c = c.replace(/if \(user && \(!user\.countryId \|\| !user\.provinceId \|\| !user\.cityId \|\| !user\.area\)\) \{/g, 'if (user && (!user.provinceId || !user.cityId || !user.area)) {');
  c = c.replace(/const countryId = params\.get\('country'\);\n/g, '');
  c = c.replace(/user\.countryId = countryId;\n/g, '');
  c = c.replace(/countryId,\n/g, '');
  return c;
});

// 5. AppShell.tsx
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/components/AppShell.tsx', c => {
  c = c.replace(/countryId: user\.countryId \|\| '',\n/g, '');
  c = c.replace(/countryId: user\.countryId,\n/g, '');
  return c;
});

// 6. LocationSetupWizard.tsx
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/components/LocationSetupWizard.tsx', c => {
  c = c.replace(/import \{ Country, /g, 'import { ');
  c = c.replace(/countryId: string;\n/g, '');
  c = c.replace(/countryId: string, /g, '');
  c = c.replace(/const \[selectedCountry, setSelectedCountry\] = useState<string>\(initialCountry \|\| ''\);\n/g, '');
  c = c.replace(/countryId: selectedCountry,\n/g, '');
  
  c = c.replace(/await dbGetProvinces\(selectedCountry\)/g, 'await dbGetProvinces()');
  c = c.replace(/await dbGetProvinces\(initialCountry\)/g, 'await dbGetProvinces()');
  
  c = c.replace(/<div className="space-y-2">\n\s*<label.*?Select Country.*?<\/select>\n\s*<\/div>/s, '');
  c = c.replace(/if \(!selectedCountry\) \{\n\s*setProvinces\(\[\]\);\n\s*return;\n\s*\}/g, '');
  return c;
});

// 7. ProfileModule.tsx
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/components/ProfileModule.tsx', c => {
  c = c.replace(/import \{ Country, /g, 'import { ');
  c = c.replace(/const \[editCountryId, setEditCountryId\] = useState<string \| undefined>\(profileData\.countryId\);\n/g, '');
  c = c.replace(/await dbGetProvinces\(editCountryId\)/g, 'await dbGetProvinces()');
  c = c.replace(/if \(!editCountryId\) return;\n/g, '');
  c = c.replace(/setEditCountryId\(profileData\.countryId\);\n/g, '');
  c = c.replace(/countryId: editCountryId \|\| '',\n/g, '');
  c = c.replace(/countryId: editCountryId,\n/g, '');
  
  c = c.replace(/\{\/\* Country Selection \*\/\}.*?<\/select>\n\s*<\/div>/s, '');
  return c;
});

// 8. SettingsModule.tsx
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/components/SettingsModule.tsx', c => {
  c = c.replace(/import \{ Country, /g, 'import { ');
  c = c.replace(/const \[countryId, setCountryId\] = useState\(user\.countryId \|\| ''\);\n/g, '');
  c = c.replace(/setCountryId\(user\.countryId \|\| ''\);\n/g, '');
  c = c.replace(/if \(!countryId\) return;\n/g, '');
  c = c.replace(/await dbGetProvinces\(countryId\)/g, 'await dbGetProvinces()');
  c = c.replace(/countryId,\n/g, '');
  
  c = c.replace(/<div className="space-y-2">\n\s*<label.*?Select Country.*?<\/select>\n\s*<\/div>/s, '');
  return c;
});

// 9. PageCreateForm.tsx
scrub('C:/Users/sys/Desktop/dhoke hassu connect/src/components/PageCreateForm.tsx', c => {
  c = c.replace(/countryId: string;\n/g, '');
  c = c.replace(/countryId: '',\n/g, '');
  return c;
});

console.log("Ultimate country purge complete.");
