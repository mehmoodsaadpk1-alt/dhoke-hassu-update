import dotenv from 'dotenv';
dotenv.config({path: './.env'});

async function test() {
  const url = `https://api.cloudinary.com/v1_1/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  
  const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64, 'base64');
  const blob = new Blob([buffer], { type: 'image/png' });
  
  formData.append('file', blob);
  formData.append('upload_preset', process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
  
  try {
    const res = await fetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    console.log('Upload result:', data);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
