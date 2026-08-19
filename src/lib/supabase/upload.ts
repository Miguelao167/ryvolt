import { createClient } from './client'

const BUCKET = 'avatars'

interface UploadResult {
  url: string
  path: string
}

/**
 * Upload an image file to Supabase Storage and return its public URL.
 * Works for any bucket/path — avatars go under `users/{userId}/{file}`,
 * community assets go under `communities/{communityId}/{file}`.
 */
export async function uploadImage(
  file: File,
  path: string,
  bucket = BUCKET,
): Promise<UploadResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
  const safeExt = /^(png|jpe?g|gif|webp|svg|avif)$/i.test(ext) ? ext : 'png'
  const fullPath = `${path.replace(/\/$/, '')}/${crypto.randomUUID()}.${safeExt}`

  const supabase = createClient()
  const { error } = await supabase
    .storage
    .from(bucket)
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${safeExt}`,
    })

  if (error) throw error

  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fullPath)
  return { url: pub.publicUrl, path: fullPath }
}

/**
 * Delete a stored object by its path (after extracting from the public URL).
 */
export async function deleteImage(path: string, bucket = BUCKET): Promise<void> {
  if (!path) return
  const supabase = createClient()
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) console.warn('Failed to delete image:', error.message)
}

export function extractStoragePath(publicUrl: string, bucket = BUCKET): string | null {
  if (!publicUrl) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx < 0) return null
  return publicUrl.slice(idx + marker.length)
}

export async function uploadUserAvatar(userId: string, file: File): Promise<string> {
  const { url } = await uploadImage(file, `users/${userId}`, BUCKET)
  return url
}

export async function uploadUserBanner(userId: string, file: File): Promise<string> {
  const { url } = await uploadImage(file, `users/${userId}/banner`, BUCKET)
  return url
}

export async function uploadCommunityIcon(communityId: string, file: File): Promise<string> {
  const { url } = await uploadImage(file, `communities/${communityId}/icon`, BUCKET)
  return url
}

export async function uploadCommunityBanner(communityId: string, file: File): Promise<string> {
  const { url } = await uploadImage(file, `communities/${communityId}/banner`, BUCKET)
  return url
}
