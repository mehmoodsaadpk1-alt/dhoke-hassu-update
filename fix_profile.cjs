const fs = require('fs');
const file = 'src/components/ProfileModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<option value="Dhoke Hassu">Dhoke Hassu<\/option>[\s\S]*?<option value="Other">Other<\/option>/g;

const replacement = `<option value="Dhoke Hassu">Dhoke Hassu</option>
                    <option value="Chota Chowk">Chota Chowk</option>
                    <option value="Alamabad">Alamabad</option>
                    <option value="Gulshan Datta">Gulshan Datta</option>
                    <option value="Allama Iqbal Colony">Allama Iqbal Colony</option>
                    <option value="Mehrabad">Mehrabad</option>
                    <option value="Dhoke Darziyan">Dhoke Darziyan</option>
                    <option value="Other">Other</option>`;

if (regex.test(content)) {
  fs.writeFileSync(file, content.replace(regex, replacement));
  console.log('Success ProfileModule');
} else {
  console.log('Target not found in ProfileModule');
}
