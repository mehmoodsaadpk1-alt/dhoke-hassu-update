const fs = require('fs');
const file = 'src/components/AdminPollsView.tsx';
let content = fs.readFileSync(file, 'utf8');

const regexOptions = /<option value="Dhoke Hassu">Dhoke Hassu<\/option>[\s\S]*?<option value="Other">Other<\/option>/g;
const replacementOptions = `<option value="Dhoke Hassu">Dhoke Hassu</option>
                        <option value="Chota Chowk">Chota Chowk</option>
                        <option value="Alamabad">Alamabad</option>
                        <option value="Gulshan Datta">Gulshan Datta</option>
                        <option value="Allama Iqbal Colony">Allama Iqbal Colony</option>
                        <option value="Mehrabad">Mehrabad</option>
                        <option value="Dhoke Darziyan">Dhoke Darziyan</option>
                        <option value="Other">Other</option>`;

if (regexOptions.test(content)) {
  content = content.replace(regexOptions, replacementOptions);
  console.log('Success AdminPollsView options');
}

const regexMock = /const areas = \['Dhoke Hassu', 'Dhoke Khabba', 'Satellite Town', 'Other'\];/;
const replacementMock = `const areas = ['Dhoke Hassu', 'Chota Chowk', 'Alamabad', 'Gulshan Datta', 'Allama Iqbal Colony', 'Mehrabad', 'Dhoke Darziyan', 'Other'];`;

if (regexMock.test(content)) {
  content = content.replace(regexMock, replacementMock);
  console.log('Success AdminPollsView mock');
}

fs.writeFileSync(file, content);
