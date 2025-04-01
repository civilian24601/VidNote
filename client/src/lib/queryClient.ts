import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { MOCK_VIDEOS, MOCK_COMMENTS, MOCK_SHARINGS } from "./mockData";
import { Video, Comment, VideoSharing } from "@shared/schema";

// This file is temporarily modified for UI development without Supabase

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Interfaces for mock responses
interface MockSuccessResponse {
  success: boolean;
}

type MockResponse<T> = T | MockSuccessResponse;

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // For UI development, create mock responses
  console.log(`Mock API request: ${method} ${url}`, data);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Create mock response based on the request
  let responseData: any = { success: true };
  let status = 200;
  
  // Handle different API endpoints
  if (url.startsWith("/api/users")) {
    if (url.includes("login") || url.includes("register")) {
      // Auth is handled by auth.ts
      responseData = { id: 1, username: "student_demo", success: true };
    }
  } 
  else if (url.startsWith("/api/videos")) {
    // Video endpoints
    if (method === "GET") {
      if (Array.isArray(MOCK_VIDEOS)) {
        responseData = [...MOCK_VIDEOS];
      } else {
        responseData = { success: true, videos: [] };
      }
    } 
    else if (method === "POST") {
      const mockVideo: Partial<Video> = { 
        ...data as object, 
        id: MOCK_VIDEOS.length + 1, 
        createdAt: new Date(),
        updatedAt: new Date(),
        videoStatus: "ready",
        viewCount: 0
      };
      responseData = { ...mockVideo, success: true };
    }
    else if (method === "PUT" || method === "PATCH") {
      const id = parseInt(url.split("/").pop() || "0");
      const foundVideo = MOCK_VIDEOS.find(v => v.id === id);
      if (foundVideo) {
        responseData = { 
          ...foundVideo, 
          ...data as object,
          updatedAt: new Date(),
          success: true
        };
      } else {
        responseData = { success: false, error: "Video not found" };
        status = 404;
      }
    }
    else if (method === "DELETE") {
      responseData = { success: true };
    }
  }
  else if (url.includes("/comments")) {
    // Comment endpoints
    if (method === "GET") {
      const videoId = parseInt(url.split("/")[3]);
      const comments = MOCK_COMMENTS.filter(c => c.videoId === videoId);
      responseData = [...comments];
    }
    else if (method === "POST") {
      const mockComment: Partial<Comment> = {
        ...data as object,
        id: MOCK_COMMENTS.length + 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      responseData = { ...mockComment, success: true };
    }
    else if (method === "PUT" || method === "DELETE") {
      responseData = { success: true };
    }
  }
  
  return new Response(JSON.stringify(responseData), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey[0] as string;
    console.log(`Mock query fetch: ${path}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Provide mock data based on the path
    let responseData: any;
    
    if (path === "/api/videos") {
      responseData = [...MOCK_VIDEOS];
    }
    else if (path === "/api/videos/shared") {
      // Filter videos that are shared
      const sharedVideoIds = MOCK_SHARINGS.map(s => s.videoId);
      responseData = MOCK_VIDEOS.filter(v => sharedVideoIds.includes(v.id));
    }
    else if (path.match(/\/api\/videos\/\d+$/)) {
      const videoId = parseInt(path.split("/").pop() || "0");
      responseData = MOCK_VIDEOS.find(v => v.id === videoId);
      
      if (!responseData) {
        throw new Error("Video not found");
      }
    }
    else if (path.match(/\/api\/videos\/\d+\/comments$/)) {
      const videoId = parseInt(path.split("/")[3]);
      responseData = MOCK_COMMENTS.filter(c => c.videoId === videoId);
    }
    else if (path.match(/\/api\/videos\/\d+\/sharing$/)) {
      const videoId = parseInt(path.split("/")[3]);
      responseData = MOCK_SHARINGS.filter(s => s.videoId === videoId);
    }
    else if (path === "/api/auth/me") {
      // This would normally check the session
      if (unauthorizedBehavior === "returnNull") {
        return null as any;
      } else {
        throw new Error("Unauthorized");
      }
    }
    else {
      console.warn(`No mock data available for path: ${path}`);
      responseData = null;
    }
    
    return responseData as T;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
