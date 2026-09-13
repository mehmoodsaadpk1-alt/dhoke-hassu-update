import { supabase } from './supabaseClient';

export interface B2UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  fileName?: string;
  contentType?: string;
  b2FileId?: string;
  error?: string;
}

/**
 * Uploads a file to Backblaze B2 via the Supabase Edge Function `b2-upload`.
 * 
 * @param file The File or Blob to upload
 * @param path The target B2 directory path (e.g., 'profiles/user_123/avatar')
 * @returns The public URL of the uploaded file or null if failed
 */
export async function uploadToB2(file: File | Blob, path: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    const { data, error } = await supabase.functions.invoke<B2UploadResponse>('b2-upload', {
      body: formData,
    });

    if (error) {
      console.error('Failed to invoke b2-upload Edge Function:', error);
      return null;
    }

    if (data?.success && data.url) {
      return data.url;
    } else {
      console.error('B2 upload returned an error:', data?.error);
      return null;
    }
  } catch (err) {
    console.error('Exception calling b2-upload Edge Function:', err);
    return null;
  }
}

/**
 * Deletes a file from Backblaze B2 via the Supabase Edge Function `delete-b2-media`.
 * It only processes URLs that belong to the configured B2 bucket.
 * 
 * @param url The public B2 URL of the file to delete
 * @returns True if successfully deleted (or not a B2 URL), false on error
 */
export async function deleteFromB2(url: string): Promise<boolean> {
  if (!url) return true;
  
  // Check if it's a B2 URL (f005.backblazeb2.com/file/dhoke-hassu-media/)
  const b2Marker = 'f005.backblazeb2.com/file/dhoke-hassu-media/';
  if (!url.includes(b2Marker)) {
    // Not a B2 URL, preserve original behavior (do nothing)
    return true;
  }

  try {
    const pathParts = url.split(b2Marker);
    if (pathParts.length < 2) return true;
    
    const fileName = pathParts[1];

    const { data, error } = await supabase.functions.invoke('delete-b2-media', {
      body: { fileName },
    });

    if (error) {
      console.error('Failed to invoke delete-b2-media Edge Function:', error);
      return false;
    }

    return data?.success === true;
  } catch (err) {
    console.error('Exception calling delete-b2-media Edge Function:', err);
    return false;
  }
}
