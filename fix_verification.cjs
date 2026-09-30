const fs = require('fs');
const file = 'src/components/VerificationModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const LOCAL_AREAS = \[[\s\S]*?\];/;

const replacement = `const LOCAL_AREAS = [
  'Dhoke Hassu',
  'Chota Chowk',
  'Alamabad',
  'Gulshan Datta',
  'Allama Iqbal Colony',
  'Mehrabad',
  'Dhoke Darziyan',
  'Other'
];`;

if (regex.test(content)) {
  fs.writeFileSync(file, content.replace(regex, replacement));
  console.log('Success VerificationModule');
} else {
  console.log('Target not found in VerificationModule');
}
