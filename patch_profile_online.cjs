const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/UserProfileView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Import OnlineIndicator
content = content.replace(
  "import FollowListModal from './FollowListModal';",
  "import FollowListModal from './FollowListModal';\nimport OnlineIndicator from './OnlineIndicator';"
);

// Add OnlineIndicator around AppAvatar
content = content.replace(
  "<AppAvatar \n                  src={profile.profilePhoto}",
  "<OnlineIndicator userId={profile.id} viewerId={currentUser?.id} showText={true} className=\"flex-col items-center gap-1 mt-3\" textClassName=\"text-[11px] font-semibold text-slate-500\">\n                <AppAvatar \n                  src={profile.profilePhoto}"
);

// Close OnlineIndicator
content = content.replace(
  "name={profile.fullName}\n                  size=\"2xl\"\n                  className=\"ring-4 ring-white shadow-xl bg-white border-2 border-slate-50\"\n                />",
  "name={profile.fullName}\n                  size=\"2xl\"\n                  className=\"ring-4 ring-white shadow-xl bg-white border-2 border-slate-50\"\n                />\n                </OnlineIndicator>"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched UserProfileView.tsx with OnlineIndicator');
