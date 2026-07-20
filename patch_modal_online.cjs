const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/FollowListModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { AppAvatar, AppButton, AppBadge, AppDropdown } from './ui';",
  "import { AppAvatar, AppButton, AppBadge, AppDropdown } from './ui';\nimport OnlineIndicator from './OnlineIndicator';"
);

content = content.replace(
  "<AppAvatar src={targetUser.profile_photo} name={targetUser.full_name} size=\"md\" />",
  "<OnlineIndicator userId={targetId} viewerId={viewerId}><AppAvatar src={targetUser.profile_photo} name={targetUser.full_name} size=\"md\" /></OnlineIndicator>"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched FollowListModal.tsx with OnlineIndicator');
