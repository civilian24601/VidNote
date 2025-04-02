import { supabase } from '../../../supabase/client';

// Helper to get the Supabase URL for constructing file URLs
const getSupabaseUrl = () => {
  // Hard-coded since we need this in browser context
  return 'https://xryyraxjizhssyrifksx.supabase.co';
};

/**
 * Get a URL for a Supabase stored file
 * 
 * @param bucket The storage bucket name (e.g., 'videos', 'thumbnails')
 * @param path The path within the bucket
 * @returns The complete public URL for the file
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${getSupabaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Uploads a file to Supabase storage
 * 
 * @param bucket The storage bucket name
 * @param path The path within the bucket (including filename)
 * @param file The file to upload
 * @returns Result with data including the path or error
 */
export async function uploadToStorage(bucket: string, path: string, file: File) {
  return supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });
}

/**
 * Get a public URL for a stored file
 * 
 * @param bucket The storage bucket name
 * @param path The path within the bucket
 * @returns Public URL for the file
 */
export function getPublicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path);
}