const { chromium } = require('playwright');
const fs = require('fs');

const runTest = async (cdnName, baseUrl) => {
  console.log(`\n\n================================`);
  console.log(`BENCHMARKING: ${cdnName}`);
  console.log(`================================`);

  // Update VideoProcessingService.ts with the new baseURL
  let serviceFile = fs.readFileSync('./src/services/VideoProcessingService.ts', 'utf8');
  serviceFile = serviceFile.replace(/private baseURL = '.*?';/, `private baseURL = '${baseUrl}';`);
  fs.writeFileSync('./src/services/VideoProcessingService.ts', serviceFile);

  // Give Vite a moment to hot reload
  await new Promise(r => setTimeout(r, 2000));

  const browser = await chromium.launch({ headless: true });
  // Use a persistent context to allow caching across page reloads
  const context = await browser.newContext();
  const page = await context.newPage();

  let ffmpegInitTime = 0;
  let ffmpegDownloadLogs = [];

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('ffmpeg.init()')) {
      ffmpegInitTime = text.match(/ffmpeg\.init\(\): (.*?) ms/)[1];
    }
  });

  page.on('response', response => {
    if (response.url().includes('ffmpeg-core.wasm')) {
      // Check if it was served from disk cache
      console.log(`[NETWORK] WASM Loaded. Status: ${response.status()}, fromServiceWorker: ${response.request().serviceWorker()}, URL: ${response.url()}`);
    }
  });

  console.log("Navigating to Vite server...");
  await page.goto('http://localhost:3001');

  // Test 1: First Upload (Cold Cache)
  console.log("\n=== TEST 1: First Upload (Cold Cache) ===");
  await page.evaluate(async () => {
    const module = await import('/src/services/VideoProcessingService.ts');
    const VideoProcessingService = module.VideoProcessingService;
    window.__service = new VideoProcessingService();

    const fakeBuffer = new Uint8Array(55 * 1024 * 1024);
    const file = new File([fakeBuffer], 'video.mp4', { type: 'video/mp4' });

    console.time("FirstUpload");
    await window.__service.compressVideo(file, p => {});
    console.timeEnd("FirstUpload");
  });
  console.log(`Cold Cache Init Time: ${ffmpegInitTime} ms`);

  // Test 2: Second Upload (Reusing existing worker)
  console.log("\n=== TEST 2: Second Upload (Reusing Worker) ===");
  ffmpegInitTime = 0; // Reset
  await page.evaluate(async () => {
    const fakeBuffer = new Uint8Array(55 * 1024 * 1024);
    const file = new File([fakeBuffer], 'video2.mp4', { type: 'video/mp4' });

    console.time("SecondUpload");
    await window.__service.compressVideo(file, p => {});
    console.timeEnd("SecondUpload");
  });
  console.log(`Worker Reuse Init Time (should be 0 or skipped): ${ffmpegInitTime} ms`);

  // Test 3: Reload Page & Upload (Warm Cache Browser Test)
  console.log("\n=== TEST 3: Reload Page (Warm Cache) ===");
  await page.reload();
  ffmpegInitTime = 0;
  await page.evaluate(async () => {
    const module = await import('/src/services/VideoProcessingService.ts');
    const VideoProcessingService = module.VideoProcessingService;
    window.__service = new VideoProcessingService();

    const fakeBuffer = new Uint8Array(55 * 1024 * 1024);
    const file = new File([fakeBuffer], 'video3.mp4', { type: 'video/mp4' });

    console.time("WarmCacheUpload");
    await window.__service.compressVideo(file, p => {});
    console.timeEnd("WarmCacheUpload");
  });
  console.log(`Warm Cache Init Time: ${ffmpegInitTime} ms`);

  await browser.close();
};

(async () => {
  try {
    await runTest('jsDelivr', 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm');
    await runTest('unpkg', 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm');
    await runTest('self-hosted', '/ffmpeg');
    console.log("\n=== ALL TESTS COMPLETED ===");
  } catch(e) {
    console.error(e);
  }
})();
