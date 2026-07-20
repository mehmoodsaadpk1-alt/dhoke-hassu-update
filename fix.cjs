const fs = require('fs');
let content = fs.readFileSync('src/components/ProfileModule.tsx', 'utf-8');

// 1. Remove location states and effects
content = content.replace(
    /  \/\/ Normalized location states\n  \/\/ Province state removed \(kept in backend\)\n  const \[editCityId[\s\S]*?(?=  \/\/ Keep edit fields in sync when profile changes)/g,
    '  // Normalized location states\n  // Location states removed to simplify Area input\n\n'
);

// 2. Remove setEdit states
content = content.replace(
    /    setEditProvinceId\(profileData\.provinceId \|\| ''\);\n    setEditCityId\(profileData\.cityId \|\| ''\);\n    setEditAreaId\(profileData\.areaId \|\| ''\);\n    setEditLat\(profileData\.latitude\);\n    setEditLng\(profileData\.longitude\);\n/,
    ''
);

// 3. Fix handleSaveProfile
content = content.replace(
    'const selectedAreaName = areasList.find(a => a.id === editAreaId)?.name || editArea;',
    'const selectedAreaName = editArea;'
);

// 4. Remove location save fields
content = content.replace(
    /      provinceId: editProvinceId,\n      cityId: editCityId,\n      areaId: editAreaId,\n      latitude: editLat,\n      longitude: editLng,\n/,
    ''
);

content = content.replace(
    /        provinceId: editProvinceId \|\| null,\n        cityId: editCityId \|\| null,\n        areaId: editAreaId \|\| null,\n        latitude: editLat \|\| null,\n        longitude: editLng \|\| null,\n/,
    ''
);

// 5. Replace JSX
const jsx_target = /              \{\/\* Country Selector \*\/\}[\s\S]*?(?=              <div>\n                <label className="block text-xs font-bold text-slate-700 mb-1\.5\">\n                  \{currentLangLabels\.contactPhone\})/;
const jsx_replacement = `              {/* Area Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {currentLanguage === 'en' ? 'Area / Locality' : 'علاقہ / محلہ'} *
                </label>
                <select
                  value={editArea}
                  onChange={(e) => setEditArea(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-semibold text-slate-800"
                >
                  <option value="Dhoke Hassu">Dhoke Hassu</option>
                  <option value="Dhoke Khabba">Dhoke Khabba</option>
                  <option value="Satellite Town">Satellite Town</option>
                  <option value="Other">Other</option>
                </select>
              </div>

`;
content = content.replace(jsx_target, jsx_replacement);

fs.writeFileSync('src/components/ProfileModule.tsx', content, 'utf-8');
console.log('done');
