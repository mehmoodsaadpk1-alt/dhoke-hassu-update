import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileName, fileId } = await req.json();

    if (!fileName) {
      return new Response(JSON.stringify({ error: 'fileName is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const b2KeyId = Deno.env.get('B2_KEY_ID');
    const b2ApplicationKey = Deno.env.get('B2_APPLICATION_KEY');

    if (!b2KeyId || !b2ApplicationKey) {
      throw new Error('B2 environment variables are missing');
    }

    // 1. Authorize with B2
    const credentials = btoa(`${b2KeyId}:${b2ApplicationKey}`);
    const authRes = await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });

    if (!authRes.ok) {
      throw new Error('Failed to authorize with B2');
    }

    const authData = await authRes.json();
    const apiUrl = authData.apiUrl;
    const authToken = authData.authorizationToken;

    // 2. We need the fileId to delete a file in B2 if we use b2_delete_file_version.
    // If fileId is not provided, we must use b2_hide_file or list files to find it.
    // For simplicity and proper deletion, b2_delete_file_version requires fileName and fileId.
    // If only fileName is provided, we can look up the fileId first.
    let targetFileId = fileId;

    if (!targetFileId) {
      const b2BucketId = Deno.env.get('B2_BUCKET_ID');
      if (!b2BucketId) throw new Error('B2_BUCKET_ID is missing');
      
      const listRes = await fetch(`${apiUrl}/b2api/v3/b2_list_file_names`, {
        method: 'POST',
        headers: {
          'Authorization': authToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketId: b2BucketId,
          startFileName: fileName,
          maxFileCount: 1
        })
      });

      if (!listRes.ok) {
        throw new Error('Failed to lookup file ID in B2');
      }

      const listData = await listRes.json();
      if (listData.files && listData.files.length > 0 && listData.files[0].fileName === fileName) {
        targetFileId = listData.files[0].fileId;
      } else {
        return new Response(JSON.stringify({ success: true, message: 'File not found' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }
    }

    // 3. Delete File from B2
    const deleteRes = await fetch(`${apiUrl}/b2api/v3/b2_delete_file_version`, {
      method: 'POST',
      headers: {
        'Authorization': authToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: fileName,
        fileId: targetFileId
      })
    });

    if (!deleteRes.ok) {
      const err = await deleteRes.json();
      console.error("B2 Delete Error:", err);
      throw new Error('Failed to delete file from B2');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error("B2 Delete Exception:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
