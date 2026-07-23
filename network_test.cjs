const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
    console.log(`[BROWSER] ${msg.text()}`);
  });

  page.on('request', request => {
    console.log(`[NETWORK] Request: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    if (response.url().includes('ffmpeg')) {
      const headers = response.headers();
      console.log(`[NETWORK] Response: ${response.status()} ${response.url()}`);
      console.log(`  - MIME: ${headers['content-type']}`);
      console.log(`  - CORS: access-control-allow-origin=${headers['access-control-allow-origin'] || 'NONE'}, cross-origin-resource-policy=${headers['cross-origin-resource-policy'] || 'NONE'}`);
    }
  });

  page.on('requestfailed', request => {
    if (request.url().includes('ffmpeg')) {
      console.log(`[NETWORK] Request Failed: ${request.url()} - ${request.failure().errorText}`);
    }
  });

  console.log("Navigating to Vite server...");
  await page.goto('http://localhost:3001');

  console.log("Executing FFmpeg network test inside browser context...");
  
  await page.evaluate(async () => {
    const module = await import('/src/services/VideoProcessingService.ts');
    const VideoProcessingService = module.VideoProcessingService;
    const service = new VideoProcessingService();

    const fakeBuffer = new Uint8Array(55 * 1024 * 1024);
    const file1 = new File([fakeBuffer], 'video1.mp4', { type: 'video/mp4' });

    console.log("\n=== STARTING TEST ===");
    try {
      const result1 = await service.compressVideo(file1, p => {});
      console.log(`Compression Used: ${result1.compressionUsed ? 'YES' : 'NO'}`);
      console.log(`Fallback Reason: ${result1.fallbackReason || 'None'}`);
    } catch (e) {
      console.error(e);
    }
  });

  await browser.close();
})();
