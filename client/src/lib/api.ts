import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Comment, User } from "@shared/schema";
import { supabase, uploadToStorage, getPublicUrl } from "./supabase";

// Auth header utility
export const getAuthHeader = (): Headers => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headers = new Headers();
  if (user?.id) {
    headers.append('Authorization', String(user.id));
    // Not logging the full user object for security, just the ID
    console.log('Auth header set with user ID:', user.id);
  } else {
    console.warn('No user ID found for auth header');
  }
  return headers;
};

// Videos
export const useVideos = () => {
  return useQuery<Video[]>({
    queryKey: ['/api/videos'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }
      
      // Get videos for current user
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching videos:', error);
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }
      
      return data || [];
    }
  });
};

export const useSharedVideos = () => {
  return useQuery<Video[]>({
    queryKey: ['/api/videos/shared'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }
      
      // First get video sharing entries for this user
      const { data: sharingData, error: sharingError } = await supabase
        .from('video_sharing')
        .select('videoId')
        .eq('userId', user.id);
      
      if (sharingError) {
        console.error('Error fetching shared videos:', sharingError);
        throw new Error(`Failed to fetch shared videos: ${sharingError.message}`);
      }
      
      if (!sharingData || sharingData.length === 0) {
        return [];
      }
      
      // Extract video IDs
      const videoIds = sharingData.map(item => item.videoId);
      
      // Get the actual videos
      const { data, error } = await supabase
        .from('videos')
        .select('*, users!inner(*)')
        .in('id', videoIds)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Error fetching shared videos:', error);
        throw new Error(`Failed to fetch shared videos: ${error.message}`);
      }
      
      return data || [];
    }
  });
};

export const useVideo = (id: string | number) => {
  return useQuery<Video>({
    queryKey: [`/api/videos/${id}`],
    enabled: !!id,
    queryFn: async () => {
      // Get the video by ID
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Error fetching video ${id}:`, error);
        throw new Error(`Failed to fetch video: ${error.message}`);
      }
      
      if (!data) {
        throw new Error(`Video with ID ${id} not found`);
      }
      
      // Increment view count
      const { error: updateError } = await supabase
        .from('videos')
        .update({ viewCount: (data.viewCount || 0) + 1 })
        .eq('id', id);
      
      if (updateError) {
        console.error(`Error updating view count for video ${id}:`, updateError);
        // Continue anyway, this is not critical
      }
      
      return data;
    }
  });
};

export const useUploadVideo = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      // Extract values from FormData
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const video = formData.get('video') as File;
      const duration = parseInt(formData.get('duration') as string || '0');
      
      // Get user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to upload videos');
      }

      // Create filename: userId/timestamp.extension
      const fileExt = video.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}.${fileExt}`;
      
      console.log(`Uploading video to Supabase storage: videos/${filePath}`);
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await uploadToStorage('videos', filePath, video);
      
      if (uploadError) {
        console.error('Video upload error:', uploadError);
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }
      
      // Get public URL
      const { data: { publicUrl } } = getPublicUrl('videos', filePath);
      
      // Create video record in Supabase
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .insert({
          title,
          description,
          url: publicUrl,
          userId: user.id,
          duration,
          videoStatus: 'ready'
        })
        .select()
        .single();
      
      if (videoError) {
        console.error('Error creating video record:', videoError);
        throw new Error(`Failed to save video metadata: ${videoError.message}`);
      }
      
      console.log('Video successfully uploaded:', videoData);
      return videoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
};

export const useUpdateVideo = (id: string | number) => {
  return useMutation({
    mutationFn: async (data: Partial<Video>) => {
      const { data: updateData, error } = await supabase
        .from('videos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`Error updating video ${id}:`, error);
        throw new Error(`Failed to update video: ${error.message}`);
      }
      
      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
};

export const useDeleteVideo = () => {
  return useMutation({
    mutationFn: async (id: string | number) => {
      // First get the video to know the file path
      const { data: video, error: getError } = await supabase
        .from('videos')
        .select('url')
        .eq('id', id)
        .single();
      
      if (getError) {
        console.error(`Error fetching video ${id} before deletion:`, getError);
        throw new Error(`Failed to fetch video for deletion: ${getError.message}`);
      }
      
      // Delete the video record from the database
      const { error: deleteError } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error(`Error deleting video ${id}:`, deleteError);
        throw new Error(`Failed to delete video: ${deleteError.message}`);
      }
      
      // If we have a URL, try to delete the file from storage
      if (video?.url) {
        try {
          // Extract path from URL
          // URL format: https://xryyraxjizhssyrifksx.supabase.co/storage/v1/object/public/videos/3/1743558976707.mp4
          const urlPath = new URL(video.url).pathname;
          // Extract the path after /public/videos/
          const storagePath = urlPath.split('/public/')[1];
          
          if (storagePath) {
            const bucket = storagePath.split('/')[0]; // 'videos'
            const path = storagePath.substring(bucket.length + 1); // '3/1743558976707.mp4'
            
            console.log(`Deleting file from storage: bucket=${bucket}, path=${path}`);
            const { error: storageError } = await supabase.storage
              .from(bucket)
              .remove([path]);
              
            if (storageError) {
              console.error(`Error deleting file from storage:`, storageError);
              // Continue anyway, the database record is already deleted
            } else {
              console.log(`Successfully deleted file from storage: ${bucket}/${path}`);
            }
          }
        } catch (storageError) {
          console.error(`Exception deleting file from storage:`, storageError);
          // Continue anyway, the database record is already deleted
        }
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
};

// Comments
export const useComments = (videoId: string | number) => {
  return useQuery<(Comment & { user: Omit<User, 'password'> })[]>({
    queryKey: [`/api/videos/${videoId}/comments`],
    enabled: !!videoId,
  });
};

export const useAddComment = (videoId: string | number) => {
  return useMutation({
    mutationFn: async (data: { content: string; timestamp: number; category?: string }) => {
      const response = await apiRequest('POST', `/api/videos/${videoId}/comments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/comments`] });
    },
  });
};

export const useDeleteComment = () => {
  return useMutation({
    mutationFn: async ({ commentId, videoId }: { commentId: number; videoId: number }) => {
      await apiRequest('DELETE', `/api/comments/${commentId}`);
      return commentId;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${variables.videoId}/comments`] });
    },
  });
};

// Video Sharing
export const useVideoSharing = (videoId: string | number) => {
  return useQuery<any[]>({
    queryKey: [`/api/videos/${videoId}/sharing`],
    enabled: !!videoId,
  });
};

export const useShareVideo = (videoId: string | number) => {
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('POST', `/api/videos/${videoId}/share`, { userId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/sharing`] });
    },
  });
};

export const useUnshareVideo = (videoId: string | number) => {
  return useMutation({
    mutationFn: async (userId: number) => {
      await apiRequest('DELETE', `/api/videos/${videoId}/share/${userId}`);
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/videos/${videoId}/sharing`] });
    },
  });
};
