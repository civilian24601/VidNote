import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { Video, Comment, VideoSharing } from "@shared/schema";
import { getAuthHeader } from "./api";

// Real API implementation with Supabase backend

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Response interfaces for types
interface ApiSuccessResponse {
  success: boolean;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API request: ${method} ${url}`, data ? 'with data' : '');
  
  const headers = getAuthHeader();
  headers.append('Content-Type', 'application/json');
  
  const options: RequestInit = {
    method,
    headers
  };
  
  if (data && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    // Log response status for debugging
    console.log(`API response: ${method} ${url} - ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${method} ${url} - ${response.status}`, errorText);
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export function getQueryFn<T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> {
  const { on401: unauthorizedBehavior } = options;
  
  return async ({ queryKey }) => {
    const path = queryKey[0] as string;
    console.log(`API fetch: ${path}`);
    
    try {
      const headers = getAuthHeader();
      console.log('Using auth headers:', headers.has('Authorization') ? 'Auth header present' : 'No auth header');
      
      const response = await fetch(path, { headers });
      
      if (response.status === 401) {
        console.error('Unauthorized request (401):', path);
        
        if (unauthorizedBehavior === "returnNull") {
          return null as any;
        } else {
          throw new Error(`Unauthorized: ${path}`);
        }
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
      }
      
      const responseData = await response.json();
      return responseData as T;
    } catch (error) {
      console.error(`API request failed for ${path}:`, error);
      throw error;
    }
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn<any>({ on401: "throw" }),
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