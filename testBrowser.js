import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[Browser PageError] ${error.message}\n${error.stack}`));

  console.log('Navigating to http://localhost:3001/marketplace...');
  await page.goto('http://localhost:3001/marketplace', { waitUntil: 'networkidle' });
  
  console.log('Waiting 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
})();
