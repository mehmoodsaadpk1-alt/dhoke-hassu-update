const fs = require('fs');

const appPath = 'C:/Users/sys/Desktop/dhoke hassu connect/src/App.tsx';
let c = fs.readFileSync(appPath, 'utf8');

c = c.replace(
  "  useEffect(() => {\n      if (hasAttemptedLocationSetup.current) {",
  "  useEffect(() => {\n    if (user && (!user.provinceId || !user.cityId || !user.area)) {\n      if (hasAttemptedLocationSetup.current) {"
);

fs.writeFileSync(appPath, c, 'utf8');
console.log("App.tsx syntax error fixed.");
