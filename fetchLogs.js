import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  try {
    const paths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let executablePath = paths.find(p => fs.existsSync(p));
    
    if (!executablePath) {
      console.error('Could not find Edge or Chrome');
      process.exit(1);
    }

    const browser = await chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[Browser PageError] ${error.message}\n${error.stack}`));

    console.log('Navigating to http://localhost:3001/home...');
    await page.goto('http://localhost:3001/home', { waitUntil: 'networkidle' });
    
    console.log('Waiting 2 seconds...');
    await page.waitForTimeout(2000);
    
    console.log('Finding Marketplace link/button and clicking...');
    await page.evaluate(() => {
      // Find the sidebar marketplace item
      const elements = Array.from(document.querySelectorAll('div, button, a'));
      for (const el of elements) {
        if (el.textContent && el.textContent.includes('Marketplace') && !el.textContent.includes('View All')) {
          el.click();
          break;
        }
      }
    });

    console.log('Waiting 5 seconds to observe behavior...');
    await page.waitForTimeout(5000);
    
    console.log('Test completed.');
    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
