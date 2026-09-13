import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate file extension and MIME type
function isValidFileType(mimeType: string): boolean {
  const allowedPrefixes = ['image/', 'video/', 'audio/'];
  const allowedSpecifics = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedPrefixes.some(prefix => mimeType.startsWith(prefix))) return true;
  if (allowedSpecifics.includes(mimeType)) return true;
  return false;
}

// Sanitize and validate the requested path
function sanitizePath(basePath: string, fileName: string): string {
  // Prevent path traversal
  const cleanPath = basePath.replace(/\.\./g, '').replace(/^\/+/, '');
  const cleanName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  
  // Create a unique name to prevent overwrites
  const uniqueId = crypto.randomUUID();
  const ext = cleanName.includes('.') ? cleanName.substring(cleanName.lastIndexOf('.')) : '';
  const nameWithoutExt = cleanName.includes('.') ? cleanName.substring(0, cleanName.lastIndexOf('.')) : cleanName;
  
  // E.g., profiles/123/avatar_uuid.jpg
  return `${cleanPath}/${nameWithoutExt}_${uniqueId}${ext}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const pathPrefix = formData.get('path'); // e.g., 'profiles/user_123'

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'File is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!pathPrefix || typeof pathPrefix !== 'string') {
      return new Response(JSON.stringify({ error: 'Path is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Validation
    if (!isValidFileType(file.type)) {
      return new Response(JSON.stringify({ error: 'Invalid file type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 50MB limit
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File too large (max 50MB)' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const b2KeyId = Deno.env.get('B2_KEY_ID');
    const b2ApplicationKey = Deno.env.get('B2_APPLICATION_KEY');
    const b2BucketId = Deno.env.get('B2_BUCKET_ID');
    const b2BucketName = Deno.env.get('B2_BUCKET_NAME');

    if (!b2KeyId || !b2ApplicationKey || !b2BucketId || !b2BucketName) {
      throw new Error('B2 environment variables are missing');
    }

    // 2. Authorize with B2
    const credentials = btoa(`${b2KeyId}:${b2ApplicationKey}`);
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!authRes.ok) {
      const err = await authRes.json();
      console.error("B2 Auth Error:", err);
      throw new Error('Failed to authorize with B2');
    }

    const authData = await authRes.json();
    const apiUrl = authData.apiInfo?.storageApi?.apiUrl || authData.apiUrl;
    const authToken = authData.authorizationToken;

    if (!apiUrl) {
      throw new Error('Failed to extract apiUrl from B2 authorization response');
    }

    // 3. Get Upload URL
    const getUploadUrlRes = await fetch(`${apiUrl}/b2api/v3/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucketId: b2BucketId })
    });

    if (!getUploadUrlRes.ok) {
      throw new Error('Failed to get B2 upload URL');
    }

    const uploadUrlData = await getUploadUrlRes.json();
    const uploadUrl = uploadUrlData.uploadUrl;
    const uploadAuthToken = uploadUrlData.authorizationToken;

    // 4. Upload File to B2
    const safeFilePath = sanitizePath(pathPrefix, file.name);
    
    // Read file data
    const arrayBuffer = await file.arrayBuffer();

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': uploadAuthToken,
        'X-Bz-File-Name': encodeURI(safeFilePath),
        'Content-Type': file.type || 'b2/x-auto',
        'X-Bz-Content-Sha1': 'do_not_verify',
        'Content-Length': file.size.toString()
      },
      body: arrayBuffer
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      console.error("B2 Upload Error:", err);
      throw new Error('Failed to upload file to B2');
    }

    const uploadResult = await uploadRes.json();
    
    // 5. Construct Public URL
    // Public URL format: https://f005.backblazeb2.com/file/dhoke-hassu-media/path/to/file.jpg
    const downloadUrlBase = authData.apiInfo?.storageApi?.downloadUrl || authData.downloadUrl;
    if (!downloadUrlBase) {
      throw new Error('Failed to extract downloadUrl from B2 authorization response');
    }
    const publicUrl = `${downloadUrlBase}/file/${b2BucketName}/${safeFilePath}`;

    return new Response(JSON.stringify({ 
      success: true,
      url: publicUrl,
      path: safeFilePath,
      fileName: file.name,
      contentType: file.type,
      b2FileId: uploadResult.fileId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("B2 Upload Exception:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
