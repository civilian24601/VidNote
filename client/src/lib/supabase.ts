// Mock Supabase client for UI development without actual Supabase credentials

export const supabase = {
  storage: {
    from: (bucket: string) => ({
      // Mock upload function
      upload: async (path: string, file: File) => ({ data: { path }, error: null }),
      // Mock getPublicUrl function
      getPublicUrl: (path: string) => ({ data: { publicUrl: URL.createObjectURL(new Blob()) } }),
      // Mock remove function
      remove: async (paths: string[]) => ({ data: { }, error: null }),
    })
  },
  auth: {
    // Mock sign in function
    signIn: async () => ({ data: { user: null }, error: null }),
    // Mock sign up function  
    signUp: async () => ({ data: { user: null }, error: null }),
    // Mock sign out function
    signOut: async () => ({ error: null }),
    // Mock getSession function
    getSession: async () => ({ data: { session: null }, error: null }),
  }
};

// Mock video upload function
export const uploadVideo = async (file: File, userId: number) => {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock successful upload
  const fileName = `video_${userId}_${Date.now()}.mp4`;
  const path = `videos/${fileName}`;
  
  // Return mock data
  return {
    url: `https://example.com/${path}`,
    thumbnailUrl: `https://example.com/thumbnails/${fileName.replace('.mp4', '.jpg')}`,
  };
};

// Mock video deletion function
export const deleteVideoFromStorage = async (videoUrl: string) => {
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock successful deletion
  return true;
};