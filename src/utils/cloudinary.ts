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

/**
 * Generates an optimized Cloudinary delivery URL for videos.
 * Uses Cloudinary transformations to optimize video delivery without altering the original file.
 * - q_auto:good: Adjusts quality for mobile viewing without heavy artifacts.
 * - f_auto: Automatically selects the most optimal video format for the requesting browser.
 * - vc_auto: Automatically selects best video codec.
 * - fl_progressive: Progressive delivery for faster start times.
 */
export function getOptimizedVideoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  
  // Only process Cloudinary URLs
  if (!url.includes('cloudinary.com') || !url.includes('/video/upload/')) {
    return url;
  }

  // Detect network quality
  let qualityTransform = 'q_auto:best,f_auto,w_1080,c_limit'; // Fast network default
  
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const conn = (navigator as any).connection;
    if (conn && conn.effectiveType) {
      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
        qualityTransform = 'q_auto:low,f_auto,w_480,c_limit';
      } else if (conn.effectiveType === '3g') {
        qualityTransform = 'q_auto,f_auto,w_720,c_limit';
      }
    }
  }

  const uploadSegment = '/upload/';
  const uploadIndex = url.indexOf(uploadSegment);
  
  if (uploadIndex === -1) return url;

  // Split the URL to inject/replace transformations
  const prefix = url.substring(0, uploadIndex + uploadSegment.length);
  const remainder = url.substring(uploadIndex + uploadSegment.length);

  const segments = remainder.split('/');
  
  // Strip out any existing transformation blocks at the beginning of the remainder
  // Cloudinary transformations are comma-separated and usually contain q_, f_, w_, c_, etc.
  while (segments.length > 1) {
    const isTransformBlock = segments[0].split(',').some(part => 
      part.startsWith('q_') || part.startsWith('f_') || part.startsWith('w_') || part.startsWith('c_')
    );
    if (isTransformBlock) {
      segments.shift();
    } else {
      break;
    }
  }

  return `${prefix}${qualityTransform}/${segments.join('/')}`;
}
