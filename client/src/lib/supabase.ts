import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// Use only SUPABASE_ env vars with proper names (not VITE prefixed)
let supabaseUrl = import.meta.env.SUPABASE_URL || '';
const supabaseKey = import.meta.env.SUPABASE_ANON_KEY || '';

// For debugging purposes
console.log('Client: Supabase URL:', supabaseUrl ? 'Exists (value hidden)' : 'Missing');
console.log('Client: Supabase Key:', supabaseKey ? 'Exists (value hidden)' : 'Missing');

// Also check for VITE_ prefixed variables as fallback
if (!supabaseUrl) {
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  console.log('Client: Falling back to VITE_SUPABASE_URL:', supabaseUrl ? 'Exists (value hidden)' : 'Missing');
}

let supabaseAnonKey = supabaseKey;
if (!supabaseAnonKey) {
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  console.log('Client: Falling back to VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Exists (value hidden)' : 'Missing');
}

// Ensure URL has https:// prefix
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Create Supabase client with fallback to avoid runtime errors
// If URL is invalid, we'll use a mock client instead
let supabaseClient;

try {
  // Only create the client if we have valid URL and key
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Client: Supabase client initialized successfully");
  } else {
    throw new Error("Missing Supabase credentials");
  }
} catch (error) {
  console.error("Client: Error creating Supabase client:", error);
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
        list: async (prefix: string, options?: { limit?: number, offset?: number, sortBy?: any }) => {
          // Return a mock successful response for testing
          if (bucket === 'videos' || bucket === 'thumbnails') {
            return { 
              data: [{ name: 'test.mp4', id: '1', metadata: {} }], 
              error: null 
            };
          }
          return { data: [], error: { message: "Bucket not found" } };
        },
      }),
      listBuckets: async () => ({ 
        data: [
          { id: "1", name: "videos", public: true },
          { id: "2", name: "thumbnails", public: true }
        ], 
        error: null 
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
    // Validate input
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    // Check file size (limit to 100MB)
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds limit of 100MB. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
    }
    
    // Extract the file extension - we'll preserve the original extension
    const originalExt = file.name.split('.').pop() || 'mp4';
    
    // Create unique filename for the video
    const fileName = `video_${userId}_${Date.now()}.${originalExt}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log(`Uploading video to Supabase: ${filePath}`);
    
    // Upload the video to Supabase storage
    const { data: videoData, error: videoError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .upload(filePath, file);
    
    if (videoError) {
      console.error('Error uploading video:', videoError);
      
      // Provide more specific error messages based on the error type
      if (videoError.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${VIDEOS_BUCKET}" not found. Please ensure it exists in your Supabase project.`);
      } else if (videoError.message.includes('JWT')) {
        throw new Error('Authentication error. Please check your Supabase API key and URL.');
      } else if (videoError.message.includes('permission')) {
        throw new Error('Permission denied when uploading. Check your Supabase bucket permissions.');
      } else {
        throw new Error(`Upload failed: ${videoError.message}`);
      }
    }
    
    console.log('Video uploaded successfully to Supabase storage');
    
    // Get the public URL for the video
    const { data: videoUrlData } = supabase.storage
      .from(VIDEOS_BUCKET)
      .getPublicUrl(filePath);
    
    // For this implementation, we'll use a default thumbnail
    // In a real app, you would generate a thumbnail from the video
    // This would typically be done server-side
    const thumbnailPath = `${userId}/${fileName.split('.')[0]}.jpg`;
    
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
  } catch (error: any) {
    console.error('Error in uploadVideo:', error);
    
    // Create a user-friendly error message if not already handled above
    if (error.message) {
      throw error; // Use the existing error if it already has a message
    } else {
      throw new Error('Failed to upload video. Please try again later.');
    }
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
    if (!videoPath) {
      console.warn('No video path provided for deletion');
      return false;
    }
    
    console.log(`Attempting to delete video from storage: ${videoPath}`);
    
    // Extract the path if a full URL was provided
    if (videoPath.startsWith('http')) {
      try {
        const url = new URL(videoPath);
        const pathParts = url.pathname.split('/');
        // Find the part after the bucket name
        const bucketIndex = pathParts.findIndex(part => part === VIDEOS_BUCKET);
        if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
          videoPath = pathParts.slice(bucketIndex + 1).join('/');
        }
      } catch (parseError) {
        console.error('Error parsing video URL:', parseError);
        // Continue with the original path
      }
    }
    
    console.log(`Deleting video file: ${videoPath}`);
    
    // Delete the video
    const { error: videoError } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .remove([videoPath]);
    
    if (videoError) {
      console.error('Error deleting video:', videoError);
      
      // Provide more specific error messages
      if (videoError.message.includes('Bucket not found')) {
        console.error(`Storage bucket "${VIDEOS_BUCKET}" not found.`);
      } else if (videoError.message.includes('JWT')) {
        console.error('Authentication error when deleting video.');
      } else if (videoError.message.includes('permission')) {
        console.error('Permission denied when deleting video.');
      } 
      
      // Continue execution to attempt to delete the thumbnail
    } else {
      console.log('Video file deleted successfully');
    }
    
    // Delete the thumbnail if provided
    if (thumbnailPath) {
      console.log(`Attempting to delete thumbnail: ${thumbnailPath}`);
      
      // Extract the path if a full URL was provided
      if (thumbnailPath.startsWith('http')) {
        try {
          const url = new URL(thumbnailPath);
          const pathParts = url.pathname.split('/');
          // Find the part after the bucket name
          const bucketIndex = pathParts.findIndex(part => part === THUMBNAILS_BUCKET);
          if (bucketIndex >= 0 && bucketIndex < pathParts.length - 1) {
            thumbnailPath = pathParts.slice(bucketIndex + 1).join('/');
          }
        } catch (parseError) {
          console.error('Error parsing thumbnail URL:', parseError);
          // Continue with the original path
        }
      }
      
      console.log(`Deleting thumbnail file: ${thumbnailPath}`);
      
      const { error: thumbnailError } = await supabase.storage
        .from(THUMBNAILS_BUCKET)
        .remove([thumbnailPath]);
      
      if (thumbnailError) {
        console.error('Error deleting thumbnail:', thumbnailError);
        // Continue even if thumbnail deletion fails
      } else {
        console.log('Thumbnail deleted successfully');
      }
    }
    
    // Return true if either the video was deleted successfully or there was no video path
    return !videoError || videoPath === '';
  } catch (error) {
    console.error('Error in deleteVideoFromStorage:', error);
    return false;
  }
};