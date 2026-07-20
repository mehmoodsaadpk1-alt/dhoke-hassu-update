const assert = require('assert');

function matchesSearch(item, searchStr) {
  if (!searchStr) return false;
  const lower = String(searchStr).toLowerCase();
  const cleanSearch = String(searchStr).replace(/[-\s()+]/g, '').toLowerCase();
  
  return !!(
    (item.title && String(item.title).toLowerCase().includes(lower)) ||
    (item.description && String(item.description).toLowerCase().includes(lower)) ||
    (item.area && String(item.area).toLowerCase().includes(lower)) ||
    (item.categoryLabel && String(item.categoryLabel).toLowerCase().includes(lower)) ||
    (item.rawData?.company && String(item.rawData.company).toLowerCase().includes(lower)) ||
    (item.rawData?.ownerName && String(item.rawData.ownerName).toLowerCase().includes(lower)) ||
    (item.rawData?.sellerName && String(item.rawData.sellerName).toLowerCase().includes(lower)) ||
    (item.rawData?.name && String(item.rawData.name).toLowerCase().includes(lower)) ||
    (item.rawData?.username && String(item.rawData.username).toLowerCase().includes(lower)) ||
    (item.rawData?.mobileNumber && String(item.rawData.mobileNumber).replace(/[-\s()+]/g, '').toLowerCase().includes(cleanSearch)) ||
    (item.rawData?.contactNumber && String(item.rawData.contactNumber).replace(/[-\s()+]/g, '').toLowerCase().includes(cleanSearch)) ||
    (item.rawData?.postedBy && String(item.rawData.postedBy).toLowerCase().includes(lower)) ||
    (item.rawData?.businessName && String(item.rawData.businessName).toLowerCase().includes(lower))
  );
}

// Test cases
const testUsers = [
  { rawData: { username: 'saad_ali', mobileNumber: '0300-1234567', contactNumber: '+923001234567', name: 'Saad Ali' } },
  { rawData: { username: 'ali_king', mobileNumber: 3001234567, contactNumber: null, name: 'Ali King' } }, // Numeric mobile
  { rawData: { username: 'bob', mobileNumber: undefined, contactNumber: undefined, name: 'Bob' } }, // Undefined mobile
];

const results = [];

// 1. Search by username
results.push(matchesSearch(testUsers[0], 'saad_ali') === true);
results.push(matchesSearch(testUsers[1], 'ali') === true);

// 2. Search by full name
results.push(matchesSearch(testUsers[0], 'saad ali') === true);

// 3. Search by mobile number formats
const mobileTests = ['03001234567', '0300-1234567', '+923001234567', '(0300)1234567', '3001234567'];
for (const t of mobileTests) {
  results.push(matchesSearch(testUsers[0], t) === true); // testUsers[0] has '0300-1234567' and '+923001234567'
}
// Test numeric
results.push(matchesSearch(testUsers[1], '3001234567') === true);

// 4. Undefined handling
results.push(matchesSearch(testUsers[2], 'bob') === true);
results.push(matchesSearch(testUsers[2], '0300') === false);

console.log("All tests passed:", results.every(r => r));
console.log("Results:", results);
