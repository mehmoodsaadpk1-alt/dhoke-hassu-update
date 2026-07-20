const fs = require('fs');

let content = fs.readFileSync('src/components/AppShell.tsx', 'utf8');

// Add import
if (!content.includes('import { ErrorBoundary }')) {
  content = content.replace(
    "import React, { useState, useEffect, Suspense, lazy } from 'react';",
    "import React, { useState, useEffect, Suspense, lazy } from 'react';\nimport { ErrorBoundary } from './ErrorBoundary';"
  );
}

const modules = [
  { tag: 'JobsModule', name: 'Jobs' },
  { tag: 'PropertyModule', name: 'Property' },
  { tag: 'ServicesModule', name: 'Services' },
  { tag: 'DealsModule', name: 'Deals' },
  { tag: 'AlertsModule', name: 'Alerts' },
  { tag: 'MarketplaceModule', name: 'Marketplace' },
  { tag: 'BusinessModule', name: 'Business' },
  { tag: 'EventsModule', name: 'Events' },
  { tag: 'GroupsModule', name: 'Groups' }
];

for (const mod of modules) {
  // We look for `<Module\n ... />` block
  const regex = new RegExp(`(<${mod.tag}\\b[^>]*\\/>)`, 'g');
  content = content.replace(regex, (match) => {
    // Already wrapped?
    if (content.includes(`<ErrorBoundary moduleName="${mod.name}">\n${match}`)) return match;
    return `<ErrorBoundary moduleName="${mod.name}">\n              ${match}\n            </ErrorBoundary>`;
  });
}

fs.writeFileSync('src/components/AppShell.tsx', content);
console.log('Error Boundaries injected!');
