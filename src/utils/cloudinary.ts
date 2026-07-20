export async function uploadMedia(
  file: File | Blob,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<string | null> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error('Cloudinary environment variables missing (cloudName or uploadPreset).');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary upload failed:', errorData);
      return null;
    }

    const data = await response.json();
    return data.secure_url || data.url;
  } catch (error) {
    console.error('Exception during Cloudinary upload:', error);
    return null;
  }
}

export async function uploadImage(file: File | Blob): Promise<string | null> {
  return uploadMedia(file, 'image');
}

export async function uploadVideo(file: File | Blob): Promise<string | null> {
  return uploadMedia(file, 'video');
}
