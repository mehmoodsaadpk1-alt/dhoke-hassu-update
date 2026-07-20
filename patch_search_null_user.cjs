const fs = require('fs');
const path = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/SearchModule.tsx';
let content = fs.readFileSync(path, 'utf8');

const allUsersOld = "const allUsers = [...realUsers, currentUser];";
const allUsersNew = "const allUsers = [...realUsers, currentUser].filter(Boolean);";

if (content.includes(allUsersOld)) {
  content = content.replace(allUsersOld, allUsersNew);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Patched SearchModule.tsx for null currentUser');
