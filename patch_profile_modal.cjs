const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/UserProfileView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
content = content.replace(
  "import StoryArchive from './StoryArchive';",
  "import StoryArchive from './StoryArchive';\nimport FollowListModal from './FollowListModal';"
);

// 2. Add state for modal
content = content.replace(
  "const [followingCount, setFollowingCount] = useState(0);",
  "const [followingCount, setFollowingCount] = useState(0);\n  const [showFollowModal, setShowFollowModal] = useState(false);\n  const [activeFollowTab, setActiveFollowTab] = useState<'followers'|'following'>('followers');"
);

// 3. Make Stats Clickable
const mapStart = "          {[";
const mapOld = "          ].map((stat, i) => (\n            <div \n              key={i}";
const mapNew = "          ].map((stat, i) => (\n            <div \n              key={i}\n              onClick={() => {\n                if (stat.labelEn === 'Followers') { setActiveFollowTab('followers'); setShowFollowModal(true); }\n                else if (stat.labelEn === 'Following') { setActiveFollowTab('following'); setShowFollowModal(true); }\n              }}\n              className={stat.labelEn === 'Followers' || stat.labelEn === 'Following' ? 'cursor-pointer hover:bg-slate-100 transition-colors rounded-xl flex-1 text-center py-2 relative' : 'flex-1 text-center py-2 relative'}";

if (content.includes("].map((stat, i) => (\n            <div \n              key={i}")) {
  // It uses className inside the div, let's just replace the whole div opening
  const divOld = "            <div \n              key={i}\n              className=\"flex-1 text-center py-2 relative\"";
  const divNew = "            <div \n              key={i}\n              onClick={() => {\n                if (stat.labelEn === 'Followers') { setActiveFollowTab('followers'); setShowFollowModal(true); }\n                else if (stat.labelEn === 'Following') { setActiveFollowTab('following'); setShowFollowModal(true); }\n              }}\n              className={\`flex-1 text-center py-2 relative \${(stat.labelEn === 'Followers' || stat.labelEn === 'Following') ? 'cursor-pointer hover:bg-slate-100 transition-colors rounded-xl' : ''}\`}";
  content = content.replace(divOld, divNew);
} else {
  // Try fallback string replacement
  const divOld2 = "<div key={i} className=\"flex-1 text-center py-2 relative\">";
  const divNew2 = "<div key={i} onClick={() => { if (stat.labelEn === 'Followers') { setActiveFollowTab('followers'); setShowFollowModal(true); } else if (stat.labelEn === 'Following') { setActiveFollowTab('following'); setShowFollowModal(true); } }} className={\`flex-1 text-center py-2 relative \${(stat.labelEn === 'Followers' || stat.labelEn === 'Following') ? 'cursor-pointer hover:bg-slate-100 transition-colors rounded-xl' : ''}\`}>";
  content = content.replace(divOld2, divNew2);
}

// 4. Inject FollowListModal at the end of the return statement
const returnEnd = "      </div>\n    </div>\n  );\n}";
const returnEndNew = `      </div>\n
      <FollowListModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
        userId={profile.id}
        viewerId={currentUser?.id}
        initialTab={activeFollowTab}
        onNavigateToProfile={(id) => {
          navigate('/profile/' + id);
        }}
      />\n    </div>\n  );\n}`;

content = content.replace(returnEnd, returnEndNew);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched UserProfileView with FollowListModal');
