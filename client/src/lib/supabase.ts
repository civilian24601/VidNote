import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for the entire app
// This client will be used for all Supabase interactions on the frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that we have the required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Authentication and storage will not work correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: (...args) => fetch(...args),
  },
});

/**
 * Get a URL for a Supabase stored file
 * 
 * @param bucket The storage bucket name (e.g., 'videos', 'thumbnails')
 * @param path The path within the bucket
 * @returns The complete public URL for the file
 */
export function getStorageUrl(bucket: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
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