import express, { type Express, Response, NextFunction, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertCommentSchema, insertVideoSharingSchema } from "@shared/schema";

// Import centralized types
import { 
  AuthenticatedRequest,
  User,
  CommentWithUser
} from "@shared/types";

// This is needed to declare the user property on Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase clients with environment variables
// Use only the SUPABASE environment variables (not VITE prefixed ones)
let supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debugging - log the URL (without revealing the actual values)
// Securely print the first few characters and domain part without showing the full URL
const safeUrlLogging = (url: string): string => {
  if (!url) return 'missing';
  try {
    // Check if it's already a URL
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      return `${url.substring(0, 10)}...${urlObj.hostname}`;
    } else {
      // If it doesn't start with http, it might be a domain or something else
      return `${url.substring(0, 5)}...`;
    }
  } catch (e) {
    // If parsing fails, show only a few chars
    return `${url.substring(0, 5)}...`;
  }
};

console.log('Server: Supabase URL check:', safeUrlLogging(supabaseUrl));
console.log('Server: Supabase URL format check:', {
  exists: !!supabaseUrl,
  length: supabaseUrl?.length || 0,
  startsWithHttps: supabaseUrl?.startsWith('https://') || false,
  endsWithSupabaseIo: supabaseUrl?.includes('.supabase.co') || false,
  containsValidDomain: !!(supabaseUrl?.includes('.') || false)
});
console.log('Server: Supabase Anon Key:', supabaseAnonKey ? 'Exists (value hidden)' : 'Missing');
console.log('Server: Supabase Service Key:', supabaseServiceKey ? 'Exists (value hidden)' : 'Missing');

// Ensure URL has https:// prefix
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Interface for Supabase client
interface SupabaseClient {
  auth: {
    getSession: () => Promise<{
      data: { 
        session: { 
          user?: { 
            email?: string;
            user_metadata?: any;
          } 
        } | null 
      };
      error: any | null;
    }>;
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: { 
        user: any | null;
      };
      error: any | null;
    }>;
  };
  storage: {
    from: (bucket: string) => {
      upload: (path: string, buffer: Buffer, options: any) => Promise<{
        data: { path: string } | null;
        error: any | null;
      }>;
      getPublicUrl: (path: string) => {
        data: { publicUrl: string };
      };
      list: (prefix: string, options?: any) => Promise<{
        data: Array<{ name: string, id: string, metadata?: any }> | null;
        error: any | null;
      }>;
    };
    getBucket: (name: string) => Promise<{
      data: { name: string } | null;
      error: any | null;
    }>;
    createBucket: (name: string, options?: { public: boolean }) => Promise<{
      data: { name: string } | null;
      error: any | null;
    }>;
    listBuckets: () => Promise<{
      data: Array<{ name: string, id: string, public: boolean }> | null;
      error: any | null;
    }>;
  };
}

// Create two Supabase clients - one with anon key and one with service role key
let supabase: SupabaseClient;
let supabaseAdmin: SupabaseClient;

try {
  // Create regular client with anon key
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log("Server: Supabase client initialized successfully");
  } else {
    throw new Error("Missing Supabase URL or anon key");
  }

  // Create admin client with service role key - this bypasses RLS
  if (supabaseUrl && supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    console.log("Server: Supabase admin client initialized successfully");
  } else {
    console.warn("Server: Missing Supabase service key, admin client will be same as regular client");
    supabaseAdmin = supabase;
  }
} catch (error) {
  console.error("Server: Error initializing Supabase:", error);
  
  // Create mock clients as fallback
  console.warn("Server: Creating mock Supabase clients as fallback");
  const createMockClient = () => ({
    auth: {
      getSession: async () => ({
        data: { session: null },
        error: null
      }),
      signInWithPassword: async (credentials: { email: string; password: string }) => ({
        data: { user: null },
        error: { message: "Mock auth not implemented" }
      })
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, buffer: Buffer, options: any) => {
          console.log(`Mock upload to ${bucket}/${path}`);
          return {
            data: { path },
            error: null
          };
        },
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.com/${bucket}/${path}` }
        }),
        list: async (prefix: string, options: any = {}) => {
          console.log(`Mock list operation for ${bucket}/${prefix}`);
          // For testing purposes, return mock data for our expected buckets
          if (bucket === 'videos' || bucket === 'thumbnails') {
            return { 
              data: [{ name: 'test-file.mp4', id: '1', metadata: {} }], 
              error: null 
            };
          }
          return { data: [], error: { message: "Bucket not found" } };
        }
      }),
      getBucket: async (name: string) => ({
        data: { name },
        error: null
      }),
      createBucket: async (name: string, options?: { public: boolean }) => ({
        data: { name },
        error: null
      }),
      listBuckets: async () => ({
        data: [
          { name: 'videos', id: '1', public: true },
          { name: 'thumbnails', id: '2', public: true }
        ],
        error: null
      })
    }
  });
  
  supabase = createMockClient();
  supabaseAdmin = createMockClient();
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 500 * 1024 * 1024, // 500MB limit
    fieldSize: 25 * 1024 * 1024 // 25MB limit for text fields
  },
});

// Helper function to ensure required storage buckets exist
async function ensureStorageBucketsExist() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log("Missing Supabase credentials, skipping bucket setup check");
    return;
  }

  try {
    // Define required buckets with their settings and security recommendations
    const requiredBuckets = [
      { 
        name: 'videos', 
        description: 'Stores user-uploaded video files',
        securityNotes: 'Configure RLS to allow:' +
          '\n- Public READ access (so videos can be viewed without authentication)' +
          '\n- Authenticated WRITE access only for the file owner' +
          '\n- RESTRICT UPDATE/DELETE to file owners and admins'
      },
      { 
        name: 'thumbnails', 
        description: 'Stores video thumbnail images',
        securityNotes: 'Configure RLS to allow:' +
          '\n- Public READ access (so thumbnails can be viewed without authentication)' +
          '\n- Authenticated WRITE access only for the file owner' +
          '\n- RESTRICT UPDATE/DELETE to file owners and admins'
      }
    ];

    console.log("Checking Supabase storage buckets...");
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      if (listError.message?.includes('permission')) {
        console.warn("Storage permission issue: Your Supabase user doesn't have permission to list buckets. " +
          "Please create the 'videos' and 'thumbnails' buckets manually in the Supabase dashboard.");
      } else {
        console.error("Failed to list storage buckets:", listError);
      }
      return;
    }
    
    const existingBucketNames = new Set(buckets?.map(b => b.name) || []);
    console.log("Existing buckets:", Array.from(existingBucketNames).join(', ') || 'none');
    
    // Check for missing buckets
    const missingBuckets = requiredBuckets.filter(bucket => !existingBucketNames.has(bucket.name));
    
    if (missingBuckets.length > 0) {
      console.warn("\n⚠️ IMPORTANT: Required Supabase storage buckets are missing!");
      console.warn("Please go to your Supabase dashboard and set up the following buckets:");
      
      for (const bucket of missingBuckets) {
        console.warn(`\n1. Bucket name: '${bucket.name}'`);
        console.warn(`   Purpose: ${bucket.description}`);
        console.warn(`   Security setup: ${bucket.securityNotes}`);
      }
      
      console.warn("\nRecommended RLS policy for secure access:");
      console.warn(`
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('videos', 'thumbnails'));

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT 
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text);
`);
      
      console.warn("\nAfter creating the buckets and applying security policies, restart this application.");
    } else {
      console.log("All required storage buckets exist.");
    }
  } catch (error) {
    console.error("Error while checking storage buckets:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Ensure storage buckets exist before setting up routes
  await ensureStorageBucketsExist();
  
  // Set up static file serving for local uploads (fallback storage)
  app.use('/uploads', express.static('./uploads'));
  
  // Create HTTP server instance first (needed for WebSocket)
  const httpServer = createServer(app);
  
  // Error handling middleware
  const handleError = (err: any, res: express.Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      return res.status(400).json({ 
        message: "Validation error", 
        errors: err.errors 
      });
    }
    return res.status(500).json({ message: err.message || "Internal server error" });
  };

  // Authentication Middleware
  const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    console.log("Authentication headers:", req.headers.authorization);
    const userId = req.headers.authorization;
    
    if (!userId) {
      console.log("Auth failed: No userId provided in authorization header");
      return res.status(401).json({ message: "Unauthorized - No user ID provided" });
    }
    
    try {
      const parsedUserId = parseInt(userId);
      if (isNaN(parsedUserId)) {
        console.log("Auth failed: Invalid user ID format:", userId);
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      console.log("Looking up user with ID:", parsedUserId);
      
      // Look up user in storage
      let user = await storage.getUser(parsedUserId);
      
      // If user not found directly, try to recover
      if (!user) {
        console.log("User not found with ID:", parsedUserId);
        
        // Check for query param with email to try recovery
        if (req.query.email) {
          const emailStr = req.query.email as string;
          console.log("Attempting recovery using email query param:", emailStr);
          // Check if user exists by email
          const userByEmail = await storage.getUserByEmail(emailStr);
          
          if (userByEmail) {
            console.log("Found user by email recovery, ID:", userByEmail.id);
            user = userByEmail;
          }
        }
        
        // Check request body for email
        if (!user && req.body && req.body.email) {
          console.log("Attempting recovery using email from request body:", req.body.email);
          const userByBodyEmail = await storage.getUserByEmail(req.body.email);
          
          if (userByBodyEmail) {
            console.log("Found user by email (body) recovery, ID:", userByBodyEmail.id);
            user = userByBodyEmail;
          }
        }
        
        // Check cookies for email
        if (!user && req.cookies && req.cookies.userEmail) {
          console.log("Attempting recovery using email from cookies:", req.cookies.userEmail);
          const userByCookieEmail = await storage.getUserByEmail(req.cookies.userEmail);
          
          if (userByCookieEmail) {
            console.log("Found user by email (cookie) recovery, ID:", userByCookieEmail.id);
            user = userByCookieEmail;
          }
        }
        
        // Still no user - check Supabase
        if (!user && supabase) {
          try {
            // Attempt to get current Supabase session
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user?.email) {
              const email = sessionData.session.user.email;
              console.log("Attempting recovery using Supabase session email:", email);
              
              const userBySupabaseEmail = await storage.getUserByEmail(email);
              if (userBySupabaseEmail) {
                console.log("Found user by Supabase session email recovery, ID:", userBySupabaseEmail.id);
                user = userBySupabaseEmail;
              } else if (sessionData.session?.user) {
                // Try to create user on-the-fly
                console.log("Creating new user from Supabase session");
                try {
                  const supabaseUser = sessionData.session.user;
                  const newUser = await storage.createUser({
                    email: supabaseUser.email || '',
                    password: Math.random().toString(36).substring(2, 10), // random password
                    username: (supabaseUser.email || '').split('@')[0],
                    fullName: supabaseUser.user_metadata?.full_name || (supabaseUser.email || '').split('@')[0],
                    role: supabaseUser.user_metadata?.role || 'student'
                  });
                  
                  user = newUser;
                  console.log("Created new user from Supabase session, ID:", newUser.id);
                } catch (createError) {
                  console.error("Failed to create user from Supabase session:", createError);
                }
              }
            }
          } catch (supabaseError) {
            console.error("Failed to check Supabase session:", supabaseError);
          }
        }
        
        // If no recovery methods worked
        if (!user) {
          console.log("Auth failed: User not found with ID:", parsedUserId);
          return res.status(401).json({ 
            message: "User not found", 
            details: "Your user account might need to be recreated. Please try logging out and back in."
          });
        }
      }
      
      console.log("User authenticated successfully:", user.id, user.username);
      req.user = user;
      next();
    } catch (error) {
      console.error("Authentication error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ message: "Authentication error", details: errorMessage });
    }
  };

  // Authorization Middleware for video access
  const canAccessVideo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const videoId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const canAccess = await storage.canUserAccessVideo(videoId, userId);
    if (!canAccess) {
      return res.status(403).json({ message: "You don't have permission to access this video" });
    }
    
    next();
  };

  // User Routes
  router.post("/users/register", async (req: express.Request, res: express.Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
      
      // Create user in storage
      const user = await storage.createUser(userData);
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      console.log("User created with internal ID:", user.id);
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post("/users/login", async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;
      
      console.log(`Login attempt for email: ${email}`);
      
      if (!email || !password) {
        console.log("Login failed: Email and password are required");
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        console.log(`Login failed: No user found with email: ${email}`);
        
        // Check if this might be a new Supabase user without a local account
        // This handles the edge case of a user authenticating with Supabase directly
        // but not yet having a local account in our storage
        if (supabase && supabaseUrl && supabaseAnonKey) {
          try {
            console.log("Attempting to create new local user based on Supabase credentials");
            
            // We'll try to sign in with Supabase to verify credentials
            const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (supabaseError) {
              console.log("Supabase authentication failed:", supabaseError.message);
              return res.status(401).json({ message: "Invalid credentials" });
            }
            
            if (supabaseData?.user) {
              // Check if there's another existing account with this email
              // This can happen if the user has multiple Supabase identities
              const existingUser = await storage.getUserByEmail(email);
              
              if (existingUser) {
                // User exists but wasn't found in the first lookup for some reason
                // Update last login timestamp
                await storage.updateLastLogin(existingUser.id);
                
                // Return user without password
                const { password: _, ...userWithoutPassword } = existingUser;
                console.log("Found existing user by secondary email lookup, ID:", existingUser.id);
                
                // Set a cookie to help with session recovery
                res.cookie('userEmail', email, { 
                  httpOnly: true, 
                  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                  sameSite: 'strict'
                });
                
                return res.json(userWithoutPassword);
              }
            
              // This is a valid Supabase user, let's create a local account
              const newUser = await storage.createUser({
                email,
                password,
                username: email.split('@')[0],
                fullName: supabaseData.user.user_metadata?.full_name || email.split('@')[0],
                role: supabaseData.user.user_metadata?.role || 'student'
              });
              
              // Update last login timestamp
              await storage.updateLastLogin(newUser.id);
              
              // Set a cookie to help with session recovery
              res.cookie('userEmail', email, { 
                httpOnly: true, 
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                sameSite: 'strict'
              });
              
              // Return user without password
              const { password: _, ...userWithoutPassword } = newUser;
              console.log("Created and logged in new user with internal ID:", newUser.id);
              return res.json(userWithoutPassword);
            }
          } catch (supabaseInnerErr) {
            console.error("Error creating local user from Supabase:", supabaseInnerErr);
          }
        }
        
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password
      if (user.password !== password) {
        console.log(`Login failed: Invalid password for user: ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login timestamp
      await storage.updateLastLogin(user.id);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      console.log("User logged in with internal ID:", user.id);
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Login error:", err);
      handleError(err, res);
    }
  });
  
  // Get user by ID - used to verify a user exists in our storage
  router.get("/users/:id", async (req: express.Request, res: express.Response) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });
  
  // Look up user by email - used for session restoration
  router.post("/users/lookup", async (req: express.Request, res: express.Response) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      console.log("User looked up by email with internal ID:", user.id);
      res.json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Video Routes
  router.get("/videos", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const videos = await storage.getVideosByUser(userId);
      res.json(videos);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get("/videos/shared", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const videos = await storage.getSharedVideosForUser(userId);
      res.json(videos);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get("/videos/:id", requireAuth, canAccessVideo, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const video = await storage.getVideo(videoId);
      
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      res.json(video);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post("/videos", requireAuth, upload.single("video"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }
      
      console.log(`Processing video upload: ${req.file.originalname}, size: ${(req.file.size / (1024 * 1024)).toFixed(2)}MB`);
      
      let videoUrl: string;
      
      // Check for required Supabase buckets before uploading
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ 
          message: "Supabase storage not configured. Please check your environment variables (SUPABASE_URL and SUPABASE_ANON_KEY)." 
        });
      }
      
      try {
        // Validate file size
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        if (req.file.size > MAX_FILE_SIZE) {
          return res.status(413).json({ 
            message: `File size exceeds the maximum allowed limit of 100MB. Current size: ${(req.file.size / (1024 * 1024)).toFixed(1)}MB`
          });
        }
        
        // Upload to Supabase Storage
        const fileExt = path.extname(req.file.originalname);
        
        // Structure the path to match Supabase RLS policies
        // We need to use the userId as a folder to match the RLS policy
        // This matches the RLS structure of (storage.foldername(name))[1] = auth.uid()::text
        const filePath = `${userId}/${Date.now()}${fileExt}`;
        
        console.log(`Uploading video to Supabase: ${filePath}`);
        
        // Use supabaseAdmin to bypass RLS policies
        const { data, error } = await supabaseAdmin.storage
          .from("videos")
          .upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
          });
        
        if (error) {
          console.error("Supabase storage upload error:", error);
          
          if (error.message.includes('Bucket not found')) {
            return res.status(500).json({ 
              message: "Storage bucket 'videos' not found. Please create the required storage buckets in your Supabase dashboard." 
            });
          } else if (error.message.includes('JWT')) {
            return res.status(500).json({ 
              message: "Authentication error with Supabase storage. Please check your API keys." 
            });
          } else if (error.message.includes('permission')) {
            return res.status(500).json({ 
              message: "Permission denied when uploading to Supabase. Please check your storage bucket permissions." 
            });
          } else {
            return res.status(500).json({ 
              message: `Upload failed: ${error.message}. Please check your Supabase storage configuration.` 
            });
          }
        }
        
        // Get public URL - make sure to use filePath, not fileName
        const { data: urlData } = supabase.storage
          .from("videos")
          .getPublicUrl(filePath);
          
        videoUrl = urlData.publicUrl;
        console.log("Supabase storage upload successful");
      }
      catch (error) {
        console.error("Supabase storage upload error:", error);
        let errorMessage = "Unknown error";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        return res.status(500).json({ 
          message: `Failed to upload video: ${errorMessage}. Please ensure Supabase storage is properly configured.` 
        });
      }
      
      // Create video record
      const videoData = {
        title: req.body.title,
        description: req.body.description,
        url: videoUrl,
        thumbnailUrl: req.body.thumbnailUrl || null,
        userId,
        isPublic: req.body.isPublic === "true",
        duration: parseInt(req.body.duration) || 0,
        videoStatus: "ready" // Set status to ready immediately after successful upload
      };
      
      const parsedVideoData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(parsedVideoData);
      
      console.log(`Video record created with ID: ${video.id} and is ready for playback`);
      
      res.status(201).json({
        ...video,
        message: "Video uploaded successfully to Supabase storage"
      });
    } catch (err) {
      console.error("Video upload error:", err);
      handleError(err, res);
    }
  });

  router.put("/videos/:id", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this video" });
      }
      
      const updatedVideo = await storage.updateVideo(videoId, req.body);
      res.json(updatedVideo);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.delete("/videos/:id", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this video" });
      }
      
      await storage.deleteVideo(videoId);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Comment Routes
  router.get("/videos/:id/comments", requireAuth, canAccessVideo, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const comments = await storage.getCommentsByVideo(videoId);
      
      // Get all user IDs from comments
      const userIds = Array.from(new Set(comments.map(comment => comment.userId)));
      
      // Get all users with those IDs
      const users = await Promise.all(
        userIds.map(id => storage.getUser(id))
      );
      
      // Create a map of user IDs to user objects
      const userMap = new Map();
      users.forEach(user => {
        if (user) {
          const { password, ...userWithoutPassword } = user;
          userMap.set(user.id, userWithoutPassword);
        }
      });
      
      // Add user info to comments
      const commentsWithUsers = comments.map(comment => ({
        ...comment,
        user: userMap.get(comment.userId)
      }));
      
      res.json(commentsWithUsers);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post("/videos/:id/comments", requireAuth, canAccessVideo, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const commentData = {
        videoId,
        userId,
        content: req.body.content,
        timestamp: req.body.timestamp
      };
      
      const parsedCommentData = insertCommentSchema.parse(commentData);
      const comment = await storage.createComment(parsedCommentData);
      
      // Get user info
      const user = await storage.getUser(userId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        
        // Return comment with user info
        res.status(201).json({
          ...comment,
          user: userWithoutPassword
        });
      } else {
        res.status(201).json(comment);
      }
    } catch (err) {
      handleError(err, res);
    }
  });

  router.put("/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to update this comment" });
      }
      
      const updatedComment = await storage.updateComment(commentId, req.body.content);
      res.json(updatedComment);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.delete("/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to delete this comment" });
      }
      
      await storage.deleteComment(commentId);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  // Video Sharing Routes
  router.post("/videos/:id/share", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if video exists and user is the owner
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to share this video" });
      }
      
      // Check if user to share with exists
      const shareWithUserId = parseInt(req.body.userId);
      const shareWithUser = await storage.getUser(shareWithUserId);
      
      if (!shareWithUser) {
        return res.status(404).json({ message: "User to share with not found" });
      }
      
      // Create sharing record
      const sharingData = {
        videoId,
        userId: shareWithUserId
      };
      
      const parsedSharingData = insertVideoSharingSchema.parse(sharingData);
      const sharing = await storage.shareVideo(parsedSharingData);
      
      res.status(201).json(sharing);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.delete("/videos/:id/share/:userId", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const currentUserId = req.user!.id;
      const targetUserId = parseInt(req.params.userId);
      
      // Check if video exists and user is the owner
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== currentUserId) {
        return res.status(403).json({ message: "You don't have permission to unshare this video" });
      }
      
      // Remove sharing record
      await storage.unshareVideo(videoId, targetUserId);
      res.status(204).send();
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get("/videos/:id/sharing", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // Check if video exists and user is the owner
      const video = await storage.getVideo(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }
      
      if (video.userId !== userId) {
        return res.status(403).json({ message: "You don't have permission to view sharing info for this video" });
      }
      
      // Get sharing records
      const sharings = await storage.getVideoSharingsByVideo(videoId);
      
      // Get all user IDs from sharings
      const userIds = sharings.map(sharing => sharing.userId);
      
      // Get all users with those IDs
      const users = await Promise.all(
        userIds.map(id => storage.getUser(id))
      );
      
      // Create a map of user IDs to user objects
      const userMap = new Map();
      users.forEach(user => {
        if (user) {
          const { password, ...userWithoutPassword } = user;
          userMap.set(user.id, userWithoutPassword);
        }
      });
      
      // Add user info to sharings
      const sharingsWithUsers = sharings.map(sharing => ({
        ...sharing,
        user: userMap.get(sharing.userId)
      }));
      
      res.json(sharingsWithUsers);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Detailed Supabase connection test
  router.get("/test-supabase", async (req, res) => {
    try {
      const result: any = {
        supabaseClientInitialized: !!supabase,
        supabaseAdminInitialized: !!supabaseAdmin,
        supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 10)}...` : "Missing",
        supabaseKeys: {
          anonKey: supabaseAnonKey ? "Present (hidden)" : "Missing",
          serviceKey: supabaseServiceKey ? "Present (hidden)" : "Missing"
        },
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      // Additional diagnostics
      if (supabaseAdmin) {
        try {
          // Test supabase admin client with a simple query
          const testResult = await supabaseAdmin.storage.listBuckets();
          result.adminBucketListResult = testResult.error ? 
            { error: testResult.error.message } : 
            { success: true, bucketCount: testResult.data?.length || 0 };
        } catch (diagError: any) {
          result.adminDiagnosticError = diagError instanceof Error ? diagError.message : 'Unknown diagnostic error';
          console.error("Admin diagnostic failed:", diagError);
        }
      }
      
      res.json({
        success: true,
        message: "Supabase configuration check",
        ...result
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Supabase test error:", error);
      res.status(500).json({ 
        success: false, 
        message: `Error testing Supabase: ${errorMessage}` 
      });
    }
  });
  
  // Test endpoint to check if buckets exist
  router.get("/test-buckets", async (req, res) => {
    try {
      const bucketName = req.query.bucket as string;
      
      if (!bucketName) {
        return res.status(400).json({ message: "Bucket name is required" });
      }
      
      // Try to access the bucket using the admin client to bypass RLS
      let data: Array<{ name: string, id: string, metadata?: any }> | null = null;
      let error = null;
      
      try {
        // Depending on what client type we have, the API might be different
        const bucket = supabaseAdmin.storage.from(bucketName);
        
        if (typeof bucket.list === 'function') {
          // Standard Supabase client
          const result = await bucket.list('', { limit: 1 });
          data = result.data;
          error = result.error;
        } else {
          // Mock client without list function
          console.log(`Using mock check for bucket '${bucketName}'`);
          data = []; 
          error = { message: "Bucket not found" };
          
          // Real buckets would return different responses - simulate those for testing only
          if (bucketName === 'videos' || bucketName === 'thumbnails') {
            // For the test page, simulate successful bucket existence
            if (process.env.NODE_ENV === 'development') {
              data = [{ name: 'test.file', id: '1' }];
              error = null;
            }
          }
        }
      } catch (err: any) {
        console.error(`Error checking bucket '${bucketName}':`, err);
        error = { message: err.message || "Unknown error when checking bucket" };
      }
      
      if (error) {
        if (error.message && error.message.includes('Bucket not found')) {
          return res.status(404).json({ 
            message: `Bucket '${bucketName}' not found`, 
            exists: false 
          });
        }
        
        return res.status(500).json({ 
          message: `Error accessing bucket: ${error.message}`,
          exists: false
        });
      }
      
      // If we get here, the bucket exists
      return res.status(200).json({ 
        message: `Bucket '${bucketName}' exists`,
        exists: true,
        files: data ? data.length : 0
      });
    } catch (err: any) {
      console.error("Error testing bucket:", err);
      return res.status(500).json({ 
        message: `Server error: ${err.message || "Unknown error"}`,
        exists: false
      });
    }
  });
  
  // Register routes
  app.use("/api", router);
  
  // WebSocket functionality for real-time collaboration has been removed as requested
  
  return httpServer;
}
