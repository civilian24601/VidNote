import * as crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  users, User, InsertUser,
  videos, Video, InsertVideo,
  comments, Comment, InsertComment,
  videoSharing, VideoSharing, InsertVideoSharing,
  studentTeacherRelationships, StudentTeacherRelationship, InsertStudentTeacherRelationship,
  notifications, Notification, InsertNotification,
  guestInvitations, GuestInvitation, InsertGuestInvitation
} from "@shared/schema";
import { SupabaseStorage } from './lib/supabaseStorage';
// Import DrizzleStorage implementation
import DrizzleStorage from './lib/drizzleStorage';
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  verifyUser(id: number): Promise<boolean>;
  updateLastLogin(id: number): Promise<boolean>;
  
  // Video operations
  getVideo(id: number): Promise<Video | undefined>;
  getVideosByUser(userId: number): Promise<Video[]>;
  getSharedVideosForUser(userId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  incrementVideoViews(id: number): Promise<boolean>;
  updateVideoStatus(id: number, status: string): Promise<boolean>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByVideo(videoId: number): Promise<Comment[]>;
  getRepliesByComment(commentId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, content: string, category?: string): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  
  // Video sharing operations
  shareVideo(sharing: InsertVideoSharing): Promise<VideoSharing>;
  getVideoSharingsByVideo(videoId: number): Promise<VideoSharing[]>;
  getVideoSharingsByUser(userId: number): Promise<VideoSharing[]>;
  unshareVideo(videoId: number, userId: number): Promise<boolean>;
  canUserAccessVideo(videoId: number, userId: number): Promise<boolean>;
  
  // Student-Teacher relationship operations
  createRelationship(relationship: InsertStudentTeacherRelationship): Promise<StudentTeacherRelationship>;
  getRelationshipById(id: number): Promise<StudentTeacherRelationship | undefined>;
  getRelationshipsByStudent(studentId: number): Promise<StudentTeacherRelationship[]>;
  getRelationshipsByTeacher(teacherId: number): Promise<StudentTeacherRelationship[]>;
  updateRelationshipStatus(id: number, status: string): Promise<boolean>;
  deleteRelationship(id: number): Promise<boolean>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // Guest Invitation operations (for one-time adjudicator access)
  createGuestInvitation(invitation: InsertGuestInvitation): Promise<GuestInvitation>;
  getGuestInvitationByToken(token: string): Promise<GuestInvitation | undefined>;
  getGuestInvitationsByVideo(videoId: number): Promise<GuestInvitation[]>;
  getGuestInvitationsByStudent(studentId: number): Promise<GuestInvitation[]>;
  updateGuestInvitationStatus(id: number, status: string): Promise<boolean>;
  markGuestInvitationUsed(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<number, Video>;
  private comments: Map<number, Comment>;
  private videoSharings: Map<number, VideoSharing>;
  private relationships: Map<number, StudentTeacherRelationship>;
  private notifications: Map<number, Notification>;
  private guestInvitations: Map<number, GuestInvitation>;
  
  private userIdCounter: number;
  private videoIdCounter: number;
  private commentIdCounter: number;
  private videoSharingIdCounter: number;
  private relationshipIdCounter: number;
  private notificationIdCounter: number;
  private guestInvitationIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.comments = new Map();
    this.videoSharings = new Map();
    this.relationships = new Map();
    this.notifications = new Map();
    this.guestInvitations = new Map();
    
    this.userIdCounter = 3; // Start after our mock users
    this.videoIdCounter = 1;
    this.commentIdCounter = 1;
    this.videoSharingIdCounter = 1;
    this.relationshipIdCounter = 1;
    this.notificationIdCounter = 1;
    this.guestInvitationIdCounter = 1;
    
    // Initialize with mock data
    this.initMockData();
  }
  
  // Initialize with mock data for development
  private initMockData() {
    // Add mock users with explicitly typed instruments as string[]
    const mockUsers: User[] = [
      {
        id: 1,
        username: "student_demo",
        email: "student@example.com",
        password: "password123",
        fullName: "Student Demo",
        role: "student",
        avatarUrl: null,
        instruments: ["Piano", "Guitar"],
        experienceLevel: "Intermediate",
        bio: "Music student passionate about classical piano and acoustic guitar.",
        verified: true,
        active: true,
        lastLogin: new Date(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        id: 2,
        username: "teacher_demo",
        email: "teacher@example.com",
        password: "password123",
        fullName: "Teacher Demo",
        role: "teacher",
        avatarUrl: null,
        instruments: ["Violin", "Piano"],
        experienceLevel: "Expert",
        bio: "Professional violinist and piano teacher with 15 years of experience.",
        verified: true,
        active: true,
        lastLogin: new Date(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      }
    ];
    
    // Add users to storage
    mockUsers.forEach(user => {
      this.users.set(user.id, user);
    });
    
    // Add mock videos
    const mockVideos: Video[] = [
      {
        id: 1,
        title: "Chopin Nocturne Op. 9 No. 2",
        userId: 1, // Student
        url: "https://example.com/videos/nocturne.mp4", // Field name must be 'url', not 'videoUrl'
        thumbnailUrl: "https://example.com/thumbnails/nocturne.jpg",
        description: "My interpretation of Chopin's Nocturne Op. 9 No. 2 in E-flat major.",
        pieceName: "Nocturne Op. 9 No. 2",
        composer: "Frédéric Chopin",
        duration: 270, // 4:30 in seconds
        viewCount: 8,
        isPublic: false,
        videoStatus: "ready",
        practiceGoals: "Working on expression and dynamics in the middle section.",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: "Bach Prelude in C Major",
        userId: 1, // Student
        url: "https://example.com/videos/bach_prelude.mp4", // Field name must be 'url', not 'videoUrl'
        thumbnailUrl: "https://example.com/thumbnails/bach_prelude.jpg",
        description: "My practice session on Bach's Prelude in C Major from The Well-Tempered Clavier.",
        pieceName: "Prelude in C Major",
        composer: "Johann Sebastian Bach",
        duration: 180, // 3:00 in seconds
        viewCount: 3,
        isPublic: false,
        videoStatus: "ready",
        practiceGoals: "Maintaining consistent tempo and articulation throughout.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Add videos to storage
    mockVideos.forEach(video => {
      this.videos.set(video.id, video);
    });
    
    // Update counter
    this.videoIdCounter = 3;
    
    // Add mock comments
    const mockComments: Comment[] = [
      {
        id: 1,
        videoId: 1,
        userId: 2, // Teacher
        content: "Beautiful dynamics in the opening section. Try to maintain that expressiveness throughout.",
        category: "interpretation",
        timestamp: 45, // 0:45
        parentCommentId: null,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        videoId: 1,
        userId: 2, // Teacher
        content: "Watch your hand position here. Your wrist is a bit too low, causing tension.",
        category: "technique",
        timestamp: 120, // 2:00
        parentCommentId: null,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Add comments to storage
    mockComments.forEach(comment => {
      this.comments.set(comment.id, comment);
    });
    
    // Update counter
    this.commentIdCounter = 3;
    
    // Create sharing relationship (teacher can access student's video)
    const mockSharing: VideoSharing = {
      id: 1,
      videoId: 1,
      userId: 2, // Teacher ID
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
    };
    
    this.videoSharings.set(mockSharing.id, mockSharing);
    this.videoSharingIdCounter = 2;
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    
    // Ensure instruments is properly formatted as string[] | null
    let instruments: string[] | null = null;
    if (insertUser.instruments) {
      if (Array.isArray(insertUser.instruments)) {
        instruments = insertUser.instruments;
      } else if (typeof insertUser.instruments === 'object') {
        instruments = [...Object.values(insertUser.instruments)] as string[];
      }
    }
    
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      verified: false,
      active: true,
      lastLogin: null,
      instruments,
      role: insertUser.role || 'student', // Default to student if role is not provided
      experienceLevel: insertUser.experienceLevel || null,
      bio: insertUser.bio || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    
    // If instruments field is present, ensure proper format
    let processedUserData = { ...userData };
    if (userData.instruments) {
      // Ensure instruments is properly formatted as string[] | null
      let instruments: string[] | null = null;
      if (Array.isArray(userData.instruments)) {
        instruments = userData.instruments;
      } else if (typeof userData.instruments === 'object') {
        instruments = [...Object.values(userData.instruments)] as string[];
      }
      
      processedUserData = {
        ...userData,
        instruments
      };
    }
    
    const updatedUser = { ...existingUser, ...processedUserData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async verifyUser(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.verified = true;
    this.users.set(id, user);
    return true;
  }
  
  async updateLastLogin(id: number): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;
    
    user.lastLogin = new Date();
    this.users.set(id, user);
    return true;
  }
  
  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }
  
  async getVideosByUser(userId: number): Promise<Video[]> {
    return Array.from(this.videos.values()).filter(
      (video) => video.userId === userId
    );
  }
  
  async getSharedVideosForUser(userId: number): Promise<Video[]> {
    // Get all video IDs that are shared with this user
    const sharedVideoIds = Array.from(this.videoSharings.values())
      .filter(sharing => sharing.userId === userId)
      .map(sharing => sharing.videoId);
    
    // Return all videos with those IDs
    return Array.from(this.videos.values()).filter(
      video => sharedVideoIds.includes(video.id)
    );
  }
  
  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = this.videoIdCounter++;
    const now = new Date();
    // Need to ensure all optional fields have null fallbacks
    const video: Video = { 
      ...insertVideo, 
      id, 
      createdAt: now,
      updatedAt: now,
      videoStatus: insertVideo.videoStatus || "processing", // Use provided status or default to processing
      viewCount: 0,
      isPublic: insertVideo.isPublic !== undefined ? insertVideo.isPublic : false,
      description: insertVideo.description || null,
      thumbnailUrl: insertVideo.thumbnailUrl || null,
      pieceName: insertVideo.pieceName || null,
      composer: insertVideo.composer || null,
      practiceGoals: insertVideo.practiceGoals || null,
      duration: insertVideo.duration || null
    };
    this.videos.set(id, video);
    return video;
  }
  
  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const existingVideo = this.videos.get(id);
    if (!existingVideo) {
      return undefined;
    }
    
    const updatedVideo = { 
      ...existingVideo, 
      ...video,
      updatedAt: new Date()
    };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }
  
  async deleteVideo(id: number): Promise<boolean> {
    // Delete all comments for this video
    Array.from(this.comments.values()).forEach(comment => {
      if (comment.videoId === id) {
        this.comments.delete(comment.id);
      }
    });
    
    // Delete all sharing records for this video
    Array.from(this.videoSharings.values()).forEach(sharing => {
      if (sharing.videoId === id) {
        this.videoSharings.delete(sharing.id);
      }
    });
    
    return this.videos.delete(id);
  }
  
  async incrementVideoViews(id: number): Promise<boolean> {
    const video = this.videos.get(id);
    if (!video) return false;
    
    video.viewCount = (video.viewCount || 0) + 1;
    this.videos.set(id, video);
    return true;
  }
  
  async updateVideoStatus(id: number, status: string): Promise<boolean> {
    const video = this.videos.get(id);
    if (!video) return false;
    
    video.videoStatus = status;
    this.videos.set(id, video);
    return true;
  }
  
  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async getCommentsByVideo(videoId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.videoId === videoId
    );
  }
  
  async getRepliesByComment(commentId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.parentCommentId === commentId
    );
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = { 
      ...insertComment, 
      id, 
      createdAt: now,
      updatedAt: now,
      category: insertComment.category || null,
      parentCommentId: insertComment.parentCommentId || null
    };
    this.comments.set(id, comment);
    return comment;
  }
  
  async updateComment(id: number, content: string, category?: string): Promise<Comment | undefined> {
    const existingComment = this.comments.get(id);
    if (!existingComment) {
      return undefined;
    }
    
    const updatedComment = { 
      ...existingComment, 
      content,
      category: category !== undefined ? category : existingComment.category,
      updatedAt: new Date()
    };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
    // Also delete any replies to this comment
    Array.from(this.comments.values()).forEach(comment => {
      if (comment.parentCommentId === id) {
        this.comments.delete(comment.id);
      }
    });
    
    return this.comments.delete(id);
  }
  
  // Video sharing operations
  async shareVideo(insertSharing: InsertVideoSharing): Promise<VideoSharing> {
    const id = this.videoSharingIdCounter++;
    const now = new Date();
    const sharing: VideoSharing = { ...insertSharing, id, createdAt: now };
    this.videoSharings.set(id, sharing);
    return sharing;
  }
  
  async getVideoSharingsByVideo(videoId: number): Promise<VideoSharing[]> {
    return Array.from(this.videoSharings.values()).filter(
      (sharing) => sharing.videoId === videoId
    );
  }
  
  async getVideoSharingsByUser(userId: number): Promise<VideoSharing[]> {
    return Array.from(this.videoSharings.values()).filter(
      (sharing) => sharing.userId === userId
    );
  }
  
  async unshareVideo(videoId: number, userId: number): Promise<boolean> {
    const sharing = Array.from(this.videoSharings.values()).find(
      s => s.videoId === videoId && s.userId === userId
    );
    
    if (sharing) {
      return this.videoSharings.delete(sharing.id);
    }
    
    return false;
  }
  
  async canUserAccessVideo(videoId: number, userId: number): Promise<boolean> {
    const video = await this.getVideo(videoId);
    if (!video) return false;
    
    // Users can access their own videos
    if (video.userId === userId) return true;
    
    // Users can access public videos
    if (video.isPublic) return true;
    
    // Users can access videos shared with them
    const sharing = Array.from(this.videoSharings.values()).find(
      s => s.videoId === videoId && s.userId === userId
    );
    
    return !!sharing;
  }
  
  // Student-Teacher relationship operations
  async createRelationship(insertRelationship: InsertStudentTeacherRelationship): Promise<StudentTeacherRelationship> {
    const id = this.relationshipIdCounter++;
    const now = new Date();
    
    const relationship: StudentTeacherRelationship = {
      ...insertRelationship,
      id,
      createdAt: now,
      updatedAt: now,
      status: insertRelationship.status || "pending"
    };
    
    this.relationships.set(id, relationship);
    return relationship;
  }
  
  async getRelationshipById(id: number): Promise<StudentTeacherRelationship | undefined> {
    return this.relationships.get(id);
  }
  
  async getRelationshipsByStudent(studentId: number): Promise<StudentTeacherRelationship[]> {
    return Array.from(this.relationships.values()).filter(
      rel => rel.studentId === studentId
    );
  }
  
  async getRelationshipsByTeacher(teacherId: number): Promise<StudentTeacherRelationship[]> {
    return Array.from(this.relationships.values()).filter(
      rel => rel.teacherId === teacherId
    );
  }
  
  async updateRelationshipStatus(id: number, status: string): Promise<boolean> {
    const relationship = this.relationships.get(id);
    if (!relationship) return false;
    
    relationship.status = status;
    relationship.updatedAt = new Date();
    this.relationships.set(id, relationship);
    return true;
  }
  
  async deleteRelationship(id: number): Promise<boolean> {
    return this.relationships.delete(id);
  }
  
  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const notification: Notification = {
      ...insertNotification,
      id,
      createdAt: now,
      isRead: false,
      relatedId: insertNotification.relatedId || null
    };
    
    this.notifications.set(id, notification);
    return notification;
  }
  
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.getTime() - a.createdAt.getTime(); // Sort newest first
      });
  }
  
  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId);
    
    for (const notification of userNotifications) {
      notification.isRead = true;
      this.notifications.set(notification.id, notification);
    }
    
    return true;
  }
  
  // Guest Invitation operations
  async createGuestInvitation(insertInvitation: InsertGuestInvitation): Promise<GuestInvitation> {
    const id = this.guestInvitationIdCounter++;
    const now = new Date();
    
    // Generate a unique UUID token
    const inviteToken = crypto.randomUUID ? crypto.randomUUID() : 
                         `inv-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const invitation: GuestInvitation = {
      ...insertInvitation,
      id,
      inviteToken,
      createdAt: now,
      role: insertInvitation.role || "adjudicator",
      message: insertInvitation.message || null,
      status: "pending",
      usedAt: null
    };
    
    this.guestInvitations.set(id, invitation);
    return invitation;
  }
  
  async getGuestInvitationByToken(token: string): Promise<GuestInvitation | undefined> {
    return Array.from(this.guestInvitations.values()).find(
      invitation => invitation.inviteToken === token
    );
  }
  
  async getGuestInvitationsByVideo(videoId: number): Promise<GuestInvitation[]> {
    return Array.from(this.guestInvitations.values()).filter(
      invitation => invitation.videoId === videoId
    );
  }
  
  async getGuestInvitationsByStudent(studentId: number): Promise<GuestInvitation[]> {
    return Array.from(this.guestInvitations.values()).filter(
      invitation => invitation.studentId === studentId
    );
  }
  
  async updateGuestInvitationStatus(id: number, status: string): Promise<boolean> {
    const invitation = this.guestInvitations.get(id);
    if (!invitation) return false;
    
    invitation.status = status;
    this.guestInvitations.set(id, invitation);
    return true;
  }
  
  async markGuestInvitationUsed(id: number): Promise<boolean> {
    const invitation = this.guestInvitations.get(id);
    if (!invitation) return false;
    
    invitation.status = "used";
    invitation.usedAt = new Date();
    this.guestInvitations.set(id, invitation);
    return true;
  }
}

// Helper function to determine if we should use Supabase or MemStorage
// This checks for presence of required environment variables
function shouldUseSupabase(): boolean {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials, falling back to MemStorage');
    return false;
  }
  
  return true;
}

// Helper function to create Supabase clients
function createSupabaseClients(): { supabase: SupabaseClient, supabaseAdmin: SupabaseClient } | null {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.warn('Missing Supabase credentials, cannot create clients');
      return null;
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    return { supabase, supabaseAdmin };
  } catch (error) {
    console.error('Error creating Supabase clients:', error);
    return null;
  }
}



// Determine which storage implementation to use
let storage: IStorage;

// Check if we should use DrizzleStorage with PostgreSQL
const shouldUsePostgres = process.env.DATABASE_URL !== undefined;

if (shouldUsePostgres) {
  console.log('Using DrizzleStorage with PostgreSQL for database operations');
  storage = new DrizzleStorage();
} else if (shouldUseSupabase()) {
  const clients = createSupabaseClients();
  if (clients) {
    console.log('Using SupabaseStorage for database operations');
    storage = new SupabaseStorage(clients.supabase, clients.supabaseAdmin);
  } else {
    console.warn('Failed to create Supabase clients, falling back to MemStorage');
    storage = new MemStorage();
  }
} else {
  console.log('Using MemStorage for database operations');
  storage = new MemStorage();
}

export { storage };
