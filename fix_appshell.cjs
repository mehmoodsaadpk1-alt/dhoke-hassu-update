const fs = require('fs');
const appShellPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/components/AppShell.tsx';

let content = fs.readFileSync(appShellPath, 'utf8');

const brokenCode = \`      console.log("[AppShell Sync User Prop] Merged Profile Result state:", JSON.stringify(merged, null, 2));
      return merged;
    });

  const [unreadNotificationsCount\`;

const fixedCode = \`      console.log("[AppShell Sync User Prop] Merged Profile Result state:", JSON.stringify(merged, null, 2));
      return merged;
    });
  }, [user?.id, user?.fullName, user?.profilePhoto, user?.provinceId, user?.cityId, user?.areaId, user?.area]);

  const [unreadNotificationsCount\`;

content = content.replace(brokenCode, fixedCode);
fs.writeFileSync(appShellPath, content, 'utf8');
console.log("AppShell.tsx syntax fixed.");
