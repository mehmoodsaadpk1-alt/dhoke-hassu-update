import { VideoProcessingService } from './src/services/VideoProcessingService';

// Mock File and Blob
class MockBlob {
  size: number;
  type: string;
  constructor(parts: any[], options: any) {
    this.size = 25 * 1024 * 1024; // 25MB compressed size mock
    this.type = options?.type || 'video/mp4';
  }
}
class MockFile extends MockBlob {
  name: string;
  lastModified: number;
  constructor(parts: any[], name: string, options: any) {
    super(parts, options);
    this.name = name;
    this.lastModified = options?.lastModified || Date.now();
    this.size = parts.length > 0 && typeof parts[0] === 'number' ? parts[0] : this.size;
  }
}

global.File = MockFile as any;
global.Blob = MockBlob as any;
Object.defineProperty(global, 'navigator', {
  value: { deviceMemory: 8 },
  configurable: true,
  writable: true
});

// Mock the dynamic imports for FFmpeg
const mockFFmpegInstance = {
  loaded: false,
  on: (event: string, cb: Function) => {
    if (event === 'log') cb({ message: 'mock ffmpeg log' });
  },
  load: async () => {
    return new Promise(resolve => setTimeout(() => {
      mockFFmpegInstance.loaded = true;
      resolve(true);
    }, 500)); // Simulate WASM loading time
  },
  writeFile: async () => true,
  exec: async () => {
    return new Promise(resolve => setTimeout(resolve, 2000)); // Simulate 2s compression time
  },
  readFile: async () => new Uint8Array(25 * 1024 * 1024), // 25MB output
  deleteFile: async () => true,
  terminate: () => { mockFFmpegInstance.loaded = false; }
};

const mockFFmpegModule = {
  FFmpeg: class {
    constructor() { return mockFFmpegInstance; }
  }
};

const mockUtilModule = {
  toBlobURL: async (url: string) => `blob:${url}`,
  fetchFile: async (file: any) => new Uint8Array(10)
};

// Intercept module imports in Node
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id: string) {
  if (id === '@ffmpeg/ffmpeg') return mockFFmpegModule;
  if (id === '@ffmpeg/util') return mockUtilModule;
  return originalRequire.apply(this, arguments);
};

async function runTest() {
  const service = new VideoProcessingService();
  
  // Create 55MB fake video
  const testFile1 = new File([55 * 1024 * 1024], 'test1.mp4', { type: 'video/mp4' });
  const testFile2 = new File([60 * 1024 * 1024], 'test2.mp4', { type: 'video/mp4' });

  console.log("\n=== FIRST UPLOAD (55MB) ===");
  const result1 = await service.compressVideo(testFile1, (p) => {});
  
  const origMb1 = (result1.originalSize / (1024 * 1024)).toFixed(2);
  const procMb1 = (result1.processedSize / (1024 * 1024)).toFixed(2);
  const timeSec1 = (result1.compressionTimeMs / 1000).toFixed(2);

  console.log(`
UPLOAD SUMMARY
---------------
Original Size: ${origMb1} MB
Compressed Size: ${procMb1} MB
Compression Time: ${timeSec1}s
Uploaded File: ${result1.compressionUsed ? 'Compressed' : 'Original'}
Compression Used: ${result1.compressionUsed ? 'YES' : 'NO'}
Fallback Reason: ${result1.fallbackReason || 'None'}
`);

  console.log("\n=== SECOND UPLOAD (60MB) ===");
  const result2 = await service.compressVideo(testFile2, (p) => {});

  const origMb2 = (result2.originalSize / (1024 * 1024)).toFixed(2);
  const procMb2 = (result2.processedSize / (1024 * 1024)).toFixed(2);
  const timeSec2 = (result2.compressionTimeMs / 1000).toFixed(2);

  console.log(`
UPLOAD SUMMARY
---------------
Original Size: ${origMb2} MB
Compressed Size: ${procMb2} MB
Compression Time: ${timeSec2}s
Uploaded File: ${result2.compressionUsed ? 'Compressed' : 'Original'}
Compression Used: ${result2.compressionUsed ? 'YES' : 'NO'}
Fallback Reason: ${result2.fallbackReason || 'None'}
`);

}

runTest().catch(console.error);
