import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// Use both SUPABASE_ and VITE_SUPABASE_ env vars with correct precedence
let supabaseUrl = import.meta.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl ? 'Exists (value hidden)' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Exists (value hidden)' : 'Missing');

// Ensure URL has https:// prefix
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Create Supabase client with fallback to avoid runtime errors
// If URL is invalid, we'll use a mock client instead
let supabaseClient;

try {
  // Only create the client if we have valid URL and key
  if (supabaseUrl && supabaseKey) {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully");
  } else {
    throw new Error("Missing Supabase credentials");
  }
} catch (error) {
  console.error("Error creating Supabase client:", error);
  // Create a mock client as fallback
  supabaseClient = createMockSupabaseClient();
}

export const supabase = supabaseClient;

// Mock client factory function
function createMockSupabaseClient() {
  console.warn("Using mock Supabase client");
  return {
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => ({ data: { path }, error: null }),
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${bucket}/${path}` } }),
        remove: async (paths: string[]) => ({ data: {}, error: null }),
      })
    },
    auth: {
      signInWithPassword: async () => ({ data: { user: null }, error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } }, error: null })
    }
  };
}

// Video Storage Buckets
const VIDEOS_BUCKET = 'videos';
const THUMBNAILS_BUCKET = 'thumbnails';

/**
 * Uploads a video file to Supabase storage
 * @param file The video file to upload
 * @param userId The ID of the user uploading the video
 * @returns Object with URLs for the video and thumbnail
 */
export const uploadVideo = async (file: File, userId: number) => {
  try {
    // Create unique filename for the video
    const fileName = `video_${userId}_${Date.now()}.mp4`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload the video to Supabase storage
    const { data: videoData, error: videoError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(filePath, file);
    
    if (videoError) {
      console.error('Error uploading video:', videoError);
      throw videoError;
    }
    
    // Get the public URL for the video
    const { data: videoUrlData } = supabase.storage
      .from(VIDEOS_BUCKET)
      .getPublicUrl(filePath);
    
    // For this implementation, we'll use a default thumbnail
    // In a real app, you would generate a thumbnail from the video
    // This would typically be done server-side
    const thumbnailPath = `${userId}/${fileName.replace('.mp4', '.jpg')}`;
    
    // Get the public URL for the thumbnail (even if it doesn't exist yet)
    const { data: thumbnailUrlData } = supabase.storage
      .from(THUMBNAILS_BUCKET)
      .getPublicUrl(thumbnailPath);
    
    return {
      url: videoUrlData.publicUrl,
      thumbnailUrl: thumbnailUrlData.publicUrl,
      path: filePath,
      thumbnailPath: thumbnailPath
    };
  } catch (error) {
    console.error('Error in uploadVideo:', error);
    throw error;
  }
};

/**
 * Deletes a video and its associated thumbnail from storage
 * @param videoPath The path of the video in storage
 * @param thumbnailPath The path of the thumbnail in storage
 * @returns Boolean indicating success
 */
export const deleteVideoFromStorage = async (videoPath: string, thumbnailPath?: string) => {
  try {
    // Extract the path if a full URL was provided
    if (videoPath.startsWith('http')) {
      const url = new URL(videoPath);
      const pathParts = url.pathname.split('/');
      // Find the part after the bucket name
      const bucketIndex = pathParts.findIndex(part => part === VIDEOS_BUCKET);
      if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
        videoPath = pathParts.slice(bucketIndex + 1).join('/');
      }
    }
    
    // Delete the video
    const { error: videoError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .remove([videoPath]);
    
    if (videoError) {
      console.error('Error deleting video:', videoError);
      return false;
    }
    
    // Delete the thumbnail if provided
    if (thumbnailPath) {
      // Extract the path if a full URL was provided
      if (thumbnailPath.startsWith('http')) {
        const url = new URL(thumbnailPath);
        const pathParts = url.pathname.split('/');
        // Find the part after the bucket name
        const bucketIndex = pathParts.findIndex(part => part === THUMBNAILS_BUCKET);
        if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
          thumbnailPath = pathParts.slice(bucketIndex + 1).join('/');
        }
      }
      
      const { error: thumbnailError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .remove([thumbnailPath]);
      
      if (thumbnailError) {
        console.error('Error deleting thumbnail:', thumbnailError);
        // Continue even if thumbnail deletion fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteVideoFromStorage:', error);
    return false;
  }
};