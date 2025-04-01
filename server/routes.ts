import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertCommentSchema, insertVideoSharingSchema } from "@shared/schema";
import { ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Mock Supabase client for development
const mockSupabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, buffer: Buffer, options: any) => ({
        data: { path },
        error: null
      }),
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `https://example.com/${path}` }
      })
    })
  }
};

// Use mock Supabase for development
const supabase = mockSupabase;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();
  
  // Error handling middleware
  const handleError = (err: any, res: Response) => {
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
  const requireAuth = async (req: Request, res: Response, next: Function) => {
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
  const canAccessVideo = async (req: Request, res: Response, next: Function) => {
    const videoId = parseInt(req.params.id);
    const userId = (req.user as any).id;
    
    const canAccess = await storage.canUserAccessVideo(videoId, userId);
    if (!canAccess) {
      return res.status(403).json({ message: "You don't have permission to access this video" });
    }
    
    next();
  };

  // User Routes
  router.post("/users/register", async (req, res) => {
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

  router.post("/users/login", async (req, res) => {
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
  router.get("/videos", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videos = await storage.getVideosByUser(userId);
      res.json(videos);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get("/videos/shared", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const videos = await storage.getSharedVideosForUser(userId);
      res.json(videos);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get("/videos/:id", requireAuth, canAccessVideo, async (req, res) => {
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

  router.post("/videos", requireAuth, upload.single("video"), async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }
      
      // Upload to Supabase Storage
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${userId}-${Date.now()}${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from("videos")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      
      if (error) {
        return res.status(500).json({ message: "Error uploading video", error });
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(fileName);
      
      // Create video record
      const videoData = {
        title: req.body.title,
        description: req.body.description,
        url: urlData.publicUrl,
        thumbnailUrl: req.body.thumbnailUrl || null,
        userId,
        isPublic: req.body.isPublic === "true",
        duration: parseInt(req.body.duration) || 0
      };
      
      const parsedVideoData = insertVideoSchema.parse(videoData);
      const video = await storage.createVideo(parsedVideoData);
      
      res.status(201).json(video);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.put("/videos/:id", requireAuth, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
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
      const userId = (req.user as any).id;
      
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
  router.get("/videos/:id/comments", requireAuth, canAccessVideo, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const comments = await storage.getCommentsByVideo(videoId);
      
      // Get all user IDs from comments
      const userIds = [...new Set(comments.map(comment => comment.userId))];
      
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

  router.post("/videos/:id/comments", requireAuth, canAccessVideo, async (req, res) => {
    try {
      const videoId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
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
      const userId = (req.user as any).id;
      
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
      const userId = (req.user as any).id;
      
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
      const userId = (req.user as any).id;
      
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
      const currentUserId = (req.user as any).id;
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
      const userId = (req.user as any).id;
      
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
  return httpServer;
}
