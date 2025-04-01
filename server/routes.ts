import express, { type Express, Response, NextFunction, Request } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertCommentSchema, insertVideoSharingSchema } from "@shared/schema";

// Import centralized types
import { 
  AuthenticatedRequest,
  WebSocketMessage,
  JoinRoomMessage,
  NewCommentMessage,
  TypingIndicatorMessage,
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

// Initialize Supabase client with environment variables
// Access client-side env variables through import.meta.env
// Use only the SUPABASE environment variables (not VITE prefixed ones)
let supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

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

// Ensure URL has https:// prefix
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// Interface for Supabase client
interface SupabaseClient {
  storage: {
    from: (bucket: string) => {
      upload: (path: string, buffer: Buffer, options: any) => Promise<{
        data: { path: string } | null;
        error: any | null;
      }>;
      getPublicUrl: (path: string) => {
        data: { publicUrl: string };
      };
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

// Create Supabase client or fallback to mock client
let supabase: SupabaseClient;

try {
  // Only create the client if we have valid URL and key
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("Server: Supabase client initialized successfully");
  } else {
    console.warn("Server: Missing Supabase credentials, using mock client");
    // Create a mock client if credentials are missing
    supabase = {
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
          })
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
    };
  }
} catch (error) {
  console.error("Server: Error initializing Supabase:", error);
  // Fallback to mock client
  supabase = {
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, buffer: Buffer, options: any) => ({
          data: { path },
          error: null
        }),
        getPublicUrl: (path: string) => ({
          data: { publicUrl: `https://example.com/${bucket}/${path}` }
        })
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
  };
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
  if (!supabaseUrl || !supabaseKey) {
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
    const userId = req.headers.authorization;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.user = user;
    next();
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
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post("/users/login", async (req: express.Request, res: express.Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
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
      if (!supabaseUrl || !supabaseKey) {
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
        
        const { data, error } = await supabase.storage
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
      catch (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return res.status(500).json({ 
          message: `Failed to upload video: ${uploadError.message || "Unknown error"}. Please ensure Supabase storage is properly configured.` 
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
        duration: parseInt(req.body.duration) || 0
      };
      
      const parsedVideoData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(parsedVideoData);
      
      console.log(`Video record created with ID: ${video.id}`);
      
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

  // Register routes
  app.use("/api", router);
  
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active connections
  const clients = new Map();
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    // Generate a unique client ID
    const clientId = Date.now();
    clients.set(clientId, { ws, videoRooms: new Set() });
    
    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle joining a video room
        if (data.type === 'join') {
          const joinMessage = data as JoinRoomMessage;
          const videoId = parseInt(joinMessage.videoId.toString());
          if (!videoId) return;
          
          // Add the client to the video room
          const client = clients.get(clientId);
          if (client) {
            client.videoRooms.add(videoId);
            client.userId = joinMessage.userId;
            
            console.log(`Client ${clientId} joined video room ${videoId}`);
            
            // Notify client they've joined successfully
            ws.send(JSON.stringify({
              type: 'joined',
              videoId: videoId
            }));
          }
        }
        
        // Handle new comments
        if (data.type === 'new_comment') {
          const { videoId, comment } = data as NewCommentMessage;
          if (!videoId || !comment) return;
          
          // Broadcast to all clients in the same video room
          clients.forEach((client, id) => {
            if (
              id !== clientId && // Don't send back to the sender
              client.videoRooms.has(videoId) && // Only clients in the same room
              client.ws.readyState === WebSocket.OPEN // Make sure connection is open
            ) {
              client.ws.send(JSON.stringify({
                type: 'new_comment',
                videoId: videoId,
                comment: comment as CommentWithUser
              }));
            }
          });
        }
        
        // Handle typing indicators
        if (data.type === 'typing') {
          const { videoId, userId, isTyping } = data as TypingIndicatorMessage;
          if (!videoId) return;
          
          // Broadcast typing status to all clients in the same video room
          clients.forEach((client, id) => {
            if (
              id !== clientId && 
              client.videoRooms.has(videoId) && 
              client.ws.readyState === WebSocket.OPEN
            ) {
              client.ws.send(JSON.stringify({
                type: 'typing',
                videoId: videoId,
                userId: userId,
                isTyping: isTyping
              }));
            }
          });
        }
        
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log(`WebSocket client ${clientId} disconnected`);
      clients.delete(clientId);
    });
  });
  
  return httpServer;
}
