import { readFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function testUpload() {
  const formData = new FormData();
  // Using a 1x1 pixel base64 jpeg
  const b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  
  const rawBase64 = b64.split(';base64,')[1];
  const byteCharacters = atob(rawBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
  formData.append('file', blob);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
  } catch(e) {
    console.error("Error:", e);
  }
}

testUpload();
