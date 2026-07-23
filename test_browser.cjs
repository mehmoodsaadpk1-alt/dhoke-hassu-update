const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
    console.log(`[BROWSER] ${msg.text()}`);
  });

  console.log("Navigating to Vite server...");
  await page.goto('http://localhost:3001');

  console.log("Executing FFmpeg upload test inside browser context...");
  
  await page.evaluate(async () => {
    // We can access VideoProcessingService if we dynamically import it via Vite
    const module = await import('/src/services/VideoProcessingService.ts');
    const VideoProcessingService = module.VideoProcessingService;
    const service = new VideoProcessingService();

    // Create a 55MB valid-looking fake file by creating a large array buffer
    // FFmpeg.wasm MIGHT still crash if the file isn't a REAL video format!
    // But we will see the exact output.
    const fakeBuffer = new Uint8Array(55 * 1024 * 1024);
    const file1 = new File([fakeBuffer], 'video1.mp4', { type: 'video/mp4' });
    const file2 = new File([new Uint8Array(60 * 1024 * 1024)], 'video2.mp4', { type: 'video/mp4' });

    console.log("\n=== FIRST UPLOAD (55MB) ===");
    try {
      const result1 = await service.compressVideo(file1, p => {});
      console.log(`
UPLOAD SUMMARY
---------------
Original Size: ${(result1.originalSize / 1024 / 1024).toFixed(2)} MB
Compressed Size: ${(result1.processedSize / 1024 / 1024).toFixed(2)} MB
Compression Used: ${result1.compressionUsed ? 'YES' : 'NO'}
Uploaded File: ${result1.compressionUsed ? 'Compressed' : 'Original'}
Fallback Reason: ${result1.fallbackReason || 'None'}
`);
    } catch (e) {
      console.error(e);
    }

    console.log("\n=== SECOND UPLOAD (60MB) ===");
    try {
      const result2 = await service.compressVideo(file2, p => {});
      console.log(`
UPLOAD SUMMARY
---------------
Original Size: ${(result2.originalSize / 1024 / 1024).toFixed(2)} MB
Compressed Size: ${(result2.processedSize / 1024 / 1024).toFixed(2)} MB
Compression Used: ${result2.compressionUsed ? 'YES' : 'NO'}
Uploaded File: ${result2.compressionUsed ? 'Compressed' : 'Original'}
Fallback Reason: ${result2.fallbackReason || 'None'}
`);
    } catch (e) {
      console.error(e);
    }
  });

  await browser.close();
})();
