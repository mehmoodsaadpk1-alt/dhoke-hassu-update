const fs = require('fs');
let content = fs.readFileSync('src/components/AppShell.tsx', 'utf8');

// 1. Inject the hook
const hookRegex = /const homeAdMap = useAdRotator\('Home Feed', 200, 5, 'Feed'\);/;
if (content.match(hookRegex) && !content.includes('const homeSectionsAdMap =')) {
  content = content.replace(hookRegex, "const homeAdMap = useAdRotator('Home Feed', 200, 5, 'Feed');\n  const homeSectionsAdMap = useAdRotator('Home Feed', 10, 2, 'Feed');");
} else {
  console.log("Hook regex not found or already added.");
}

// 2. Insert Ad blocks
const replacements = [
  {
    find: /<div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-property-preview-header">/,
    replace: `\n              {/* INJECTED SECTION AD 0 */}\n              {homeSectionsAdMap[1] && (\n                <div className="py-2 border-t border-slate-100">\n                  <AdBannerCard ad={homeSectionsAdMap[1]} onNavigateToModule={handleNavigateToModule} />\n                </div>\n              )}\n\n              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-property-preview-header">`
  },
  {
    find: /<div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-marketplace-preview-header">/,
    replace: `\n              {/* INJECTED SECTION AD 1 */}\n              {homeSectionsAdMap[3] && (\n                <div className="py-2 border-t border-slate-100">\n                  <AdBannerCard ad={homeSectionsAdMap[3]} onNavigateToModule={handleNavigateToModule} />\n                </div>\n              )}\n\n              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-marketplace-preview-header">`
  },
  {
    find: /<div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-alerts-preview-header">/,
    replace: `\n              {/* INJECTED SECTION AD 2 */}\n              {homeSectionsAdMap[5] && (\n                <div className="py-2 border-t border-slate-100">\n                  <AdBannerCard ad={homeSectionsAdMap[5]} onNavigateToModule={handleNavigateToModule} />\n                </div>\n              )}\n\n              <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="home-alerts-preview-header">`
  },
  {
    find: /<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="home-groups-preview-grid">/,
    replace: `\n              {/* INJECTED SECTION AD 3 */}\n              {homeSectionsAdMap[7] && (\n                <div className="py-2 border-t border-slate-100">\n                  <AdBannerCard ad={homeSectionsAdMap[7]} onNavigateToModule={handleNavigateToModule} />\n                </div>\n              )}\n\n              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="home-groups-preview-grid">`
  }
];

let updated = content;
for (const r of replacements) {
  if (updated.match(r.find) && !updated.includes(r.replace.trim().split('\n')[0])) {
    updated = updated.replace(r.find, r.replace);
  } else {
    console.log("Could not match or already replaced: " + r.find);
  }
}

fs.writeFileSync('src/components/AppShell.tsx', updated);
console.log("Done.");
