# fix_supabase3.ps1 - handles CRLF line endings to restore dbUploadVoiceMessage and add dbUploadChatAttachment
$filePath = "src\utils\supabaseClient.ts"
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# The exact broken fragment (with CRLF)
$broken = "    if (error) {`r`n      console.warn(`"Error uploading voice message:`", error.message);`r`n      return null;`r`n    }`r`n/**`r`n * ============================================================================`r`n * 3b. POST LIKES SERVICE"

$fixed = "    if (error) {`r`n      console.warn(`"Error uploading voice message:`", error.message);`r`n      return null;`r`n    }`r`n`r`n    const { data: { publicUrl } } = supabase.storage`r`n      .from('chat-voice')`r`n      .getPublicUrl(filePath);`r`n`r`n    return publicUrl;`r`n  } catch (err) {`r`n    console.error(`"[CHAT ERROR] Exception in dbUploadVoiceMessage:`", err);`r`n    return null;`r`n  }`r`n}`r`n`r`nexport async function dbDeletePost(postId: string): Promise<boolean> {`r`n  return safeDelete('posts', postId);`r`n}`r`n`r`nexport async function dbUploadChatAttachment(`r`n  userId: string,`r`n  conversationId: string,`r`n  file: File | Blob,`r`n  fileNameStr: string`r`n): Promise<{ url: string; size: number } | null> {`r`n  if (!isSupabaseConfigured || !supabase) return null;`r`n  try {`r`n    const dateStr = new Date().toISOString().split('T')[0];`r`n    const uniqueId = Math.random().toString(36).substring(2, 9);`r`n    const safeFileName = fileNameStr.replace(/[^a-zA-Z0-9.-]/g, '_');`r`n    const finalName = `${Date.now()}-${uniqueId}-${safeFileName}`;`r`n    const filePath = `${userId}/${conversationId}/${dateStr}/${finalName}`;`r`n`r`n    let bucket = 'chat-attachments';`r`n    let { data, error } = await supabase.storage`r`n      .from(bucket)`r`n      .upload(filePath, file, { cacheControl: '3600' });`r`n`r`n    if (error && error.message.includes('Bucket not found')) {`r`n       console.log(`"[CHAT]`", `"chat-attachments bucket not found, falling back to 'posts'`");`r`n       bucket = 'posts';`r`n       const fallbackRes = await supabase.storage.from(bucket).upload(`"chat/${filePath}`", file, { cacheControl: '3600' });`r`n       error = fallbackRes.error;`r`n       data = fallbackRes.data;`r`n    }`r`n`r`n    if (error) {`r`n      console.error(`"[CHAT ERROR]`", `"Error uploading attachment:`", error.message);`r`n      return null;`r`n    }`r`n`r`n    const { data: { publicUrl } } = supabase.storage`r`n      .from(bucket)`r`n      .getPublicUrl(bucket === 'posts' ? `"chat/${filePath}`" : filePath);`r`n`r`n    console.log(`"[CHAT]`", `"Attachment uploaded successfully`", publicUrl);`r`n    return { url: publicUrl, size: file.size };`r`n  } catch (err) {`r`n    console.error(`"[CHAT ERROR]`", `"Exception in dbUploadChatAttachment:`", err);`r`n    return null;`r`n  }`r`n}`r`n`r`n/**`r`n * ============================================================================`r`n * 3b. POST LIKES SERVICE"

if ($content.Contains($broken)) {
    $newContent = $content.Replace($broken, $fixed)
    $newBytes = [System.Text.Encoding]::UTF8.GetBytes($newContent)
    [System.IO.File]::WriteAllBytes($filePath, $newBytes)
    Write-Host "SUCCESS: File repaired and dbUploadChatAttachment added."
} else {
    Write-Host "ERROR: Broken fragment not found. Showing raw hex:"
    $lines = $content -split "`n"
    for ($i = 645; $i -lt [Math]::Min(655, $lines.Length); $i++) {
        $line = $lines[$i]
        $hex = ($line.ToCharArray() | ForEach-Object { [string]::Format("{0:X2}", [int]$_) }) -join " "
        Write-Host "Line $($i+1): [$line] HEX: $hex"
    }
}
