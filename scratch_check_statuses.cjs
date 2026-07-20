const fs = require('fs');
const files = [
  'src/components/JobsModule.tsx',
  'src/components/PropertyModule.tsx',
  'src/components/ServicesModule.tsx',
  'src/components/MarketplaceModule.tsx',
  'src/components/BusinessModule.tsx'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const hasPending = content.includes("status: 'Pending'") || content.includes('status: "Pending"');
    const hasActive = content.includes("status: 'Active'") || content.includes('status: "Active"');
    console.log(`${f}: Pending=${hasPending}, Active=${hasActive}`);
  } else {
    console.log(`${f}: file not found`);
  }
});
