const fs = require('fs');
const files = [
  'MarketplaceModule.tsx',
  'JobsModule.tsx',
  'PropertyModule.tsx',
  'ServicesModule.tsx',
  'BusinessModule.tsx',
  'AlertsModule.tsx',
  'DealsModule.tsx',
  'GroupsModule.tsx',
  'SearchModule.tsx'
];

for (const file of files) {
  let content = fs.readFileSync('src/components/' + file, 'utf8');

  // Skip AppShell, we'll do it manually because it has homeAdMap and communityAdMap
  if (file === 'AppShell.tsx') continue;

  // 1. Find the useAdRotator call for the feed
  const match = content.match(/const (\w+)AdMap = useAdRotator\('([^']+)', ([^,]+), (\d+)\);/);
  if (!match) {
    // check if we already added 'Feed' or 'Banner'
    const match2 = content.match(/const (\w+)AdMap = useAdRotator\('([^']+)', ([^,]+), (\d+), 'Feed'\);/);
    if (!match2) {
      console.log('Skipping ' + file + ' - no match');
      continue;
    } else {
      console.log('Already processed ' + file);
      continue;
    }
  }

  const varPrefix = match[1];
  const placement = match[2];
  const count = match[3];
  const interval = match[4];

  // Replace with two calls
  const newCalls = `const ${varPrefix}BannerMap = useAdRotator('${placement}', 1, 1, 'Banner');\n  const ${varPrefix}AdMap = useAdRotator('${placement}', ${count}, ${interval}, 'Feed');`;
  content = content.replace(match[0], newCalls);

  // 2. Find the start of the return ( ... stage div
  // The div might be like <div className="..." id="...-stage">
  const stageRegex = /return \(\s*<div[^>]+id="[^"]+-stage"[^>]*>/;
  const stageMatch = content.match(stageRegex);
  
  if (stageMatch) {
    const bannerHtml = `\n      {/* Top Banner Ad Segment */}\n      {${varPrefix}BannerMap[0] && (\n        <div className="mb-6">\n          <AdBannerCard ad={${varPrefix}BannerMap[0]} />\n        </div>\n      )}\n`;
    content = content.replace(stageRegex, stageMatch[0] + bannerHtml);
    fs.writeFileSync('src/components/' + file, content);
    console.log('Updated ' + file);
  } else {
    // Maybe search for main container if -stage is not there
    const altRegex = /return \(\s*<div[^>]*max-w-[^>]*>/;
    const altMatch = content.match(altRegex);
    if (altMatch) {
      const bannerHtml = `\n      {/* Top Banner Ad Segment */}\n      {${varPrefix}BannerMap[0] && (\n        <div className="mb-6">\n          <AdBannerCard ad={${varPrefix}BannerMap[0]} />\n        </div>\n      )}\n`;
      content = content.replace(altRegex, altMatch[0] + bannerHtml);
      fs.writeFileSync('src/components/' + file, content);
      console.log('Updated ' + file + ' using alt regex');
    } else {
      console.log('Could not find stage div in ' + file);
    }
  }
}
