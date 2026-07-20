const fs = require('fs');
let content = fs.readFileSync('src/components/GroupsModule.tsx', 'utf8');

// I will just restore the exact lines that were accidentally deleted:
//   const groupsAdMap = useAdRotator('Public Groups', groups.length, 5);
//   const isUr = currentLanguage === 'ur';
//   const [searchTerm, setSearchTerm] = useState('');

content = content.replace(
  "  selectedGroupId,\n  onSelectGroupId\n}: GroupsModuleProps) {\n  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);",
  "  selectedGroupId,\n  onSelectGroupId\n}: GroupsModuleProps) {\n  const groupsBannerMap = useAdRotator('Public Groups', 1, 1, 'Banner');\n  const groupsAdMap = useAdRotator('Public Groups', 200, 5, 'Feed');\n  const isUr = currentLanguage === 'ur';\n\n  const [searchTerm, setSearchTerm] = useState('');\n  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);"
);

// Inject top banner
const stageRegex = /return \(\s*<div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 animate-fade-in" id="groups-main-stage">/;
if (content.match(stageRegex)) {
  content = content.replace(stageRegex, `return (\n    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 animate-fade-in" id="groups-main-stage">\n      {groupsBannerMap[0] && (\n        <div className="mb-6">\n          <AdBannerCard ad={groupsBannerMap[0]} />\n        </div>\n      )}`);
}

fs.writeFileSync('src/components/GroupsModule.tsx', content);
