import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Video, Comment, User } from "@shared/schema";

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
  });
};

export const useSharedVideos = () => {
  return useQuery<Video[]>({
    queryKey: ['/api/videos/shared'],
  });
};

export const useVideo = (id: string | number) => {
  return useQuery<Video>({
    queryKey: [`/api/videos/${id}`],
    enabled: !!id,
  });
};

export const useUploadVideo = () => {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: getAuthHeader(),
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/videos'] });
    },
  });
};

export const useUpdateVideo = (id: string | number) => {
  return useMutation({
    mutationFn: async (data: Partial<Video>) => {
      const response = await apiRequest('PUT', `/api/videos/${id}`, data);
      return response.json();
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
      await apiRequest('DELETE', `/api/videos/${id}`);
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
