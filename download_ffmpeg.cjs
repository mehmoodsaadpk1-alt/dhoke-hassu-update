const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302) {
        https.get(response.headers.location, (res) => {
          res.pipe(file);
          file.on('finish', () => file.close(resolve));
        });
      } else {
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
};

(async () => {
  const dir = path.join(__dirname, 'public', 'ffmpeg');
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log("Downloading core JS...");
  await download('https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js', path.join(dir, 'ffmpeg-core.js'));
  console.log("Downloading core WASM...");
  await download('https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm', path.join(dir, 'ffmpeg-core.wasm'));
  console.log("Done.");
})();
