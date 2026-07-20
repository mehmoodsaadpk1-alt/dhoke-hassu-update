export async function uploadMedia(
  file: File | Blob,
  resourceType: 'image' | 'video' | 'raw' = 'image',
  onProgress?: (progress: number) => void
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

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);

    if (onProgress && xhr.upload) {
      let lastPercent = -1;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          if (percent > lastPercent) {
            lastPercent = percent;
            onProgress(percent);
          }
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url || data.url);
        } catch (e) {
          console.error('Failed to parse Cloudinary response:', e);
          resolve(null);
        }
      } else {
        console.error('Cloudinary upload failed:', xhr.responseText);
        resolve(null);
      }
    };

    xhr.onerror = () => {
      console.error('Exception during Cloudinary upload');
      resolve(null);
    };

    xhr.send(formData);
  });
}

export async function uploadImage(file: File | Blob, onProgress?: (progress: number) => void): Promise<string | null> {
  return uploadMedia(file, 'image', onProgress);
}

export async function uploadVideo(file: File | Blob, onProgress?: (progress: number) => void): Promise<string | null> {
  return uploadMedia(file, 'video', onProgress);
}

export async function deleteMedia(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
  try {
    const { supabase } = await import('./supabaseClient');
    if (!supabase) return false;
    
    const { data, error } = await supabase.functions.invoke('delete-cloudinary-media', {
      body: { publicId, resourceType }
    });
    
    if (error) {
      console.error('Failed to invoke delete-cloudinary-media edge function:', error);
      return false;
    }
    
    return data?.result === 'ok';
  } catch (err) {
    console.error('Exception calling Cloudinary delete edge function:', err);
    return false;
  }
}
