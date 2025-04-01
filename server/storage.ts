import {
  users, User, InsertUser,
  videos, Video, InsertVideo,
  comments, Comment, InsertComment,
  videoSharing, VideoSharing, InsertVideoSharing
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Video operations
  getVideo(id: number): Promise<Video | undefined>;
  getVideosByUser(userId: number): Promise<Video[]>;
  getSharedVideosForUser(userId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined>;
  deleteVideo(id: number): Promise<boolean>;
  
  // Comment operations
  getComment(id: number): Promise<Comment | undefined>;
  getCommentsByVideo(videoId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  updateComment(id: number, content: string): Promise<Comment | undefined>;
  deleteComment(id: number): Promise<boolean>;
  
  // Video sharing operations
  shareVideo(sharing: InsertVideoSharing): Promise<VideoSharing>;
  getVideoSharingsByVideo(videoId: number): Promise<VideoSharing[]>;
  unshareVideo(videoId: number, userId: number): Promise<boolean>;
  canUserAccessVideo(videoId: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private videos: Map<number, Video>;
  private comments: Map<number, Comment>;
  private videoSharings: Map<number, VideoSharing>;
  
  private userIdCounter: number;
  private videoIdCounter: number;
  private commentIdCounter: number;
  private videoSharingIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.videos = new Map();
    this.comments = new Map();
    this.videoSharings = new Map();
    
    this.userIdCounter = 1;
    this.videoIdCounter = 1;
    this.commentIdCounter = 1;
    this.videoSharingIdCounter = 1;
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
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
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
    const video: Video = { ...insertVideo, id, createdAt: now };
    this.videos.set(id, video);
    return video;
  }
  
  async updateVideo(id: number, video: Partial<InsertVideo>): Promise<Video | undefined> {
    const existingVideo = this.videos.get(id);
    if (!existingVideo) {
      return undefined;
    }
    
    const updatedVideo = { ...existingVideo, ...video };
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
  
  // Comment operations
  async getComment(id: number): Promise<Comment | undefined> {
    return this.comments.get(id);
  }
  
  async getCommentsByVideo(videoId: number): Promise<Comment[]> {
    return Array.from(this.comments.values()).filter(
      (comment) => comment.videoId === videoId
    );
  }
  
  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const comment: Comment = { ...insertComment, id, createdAt: now };
    this.comments.set(id, comment);
    return comment;
  }
  
  async updateComment(id: number, content: string): Promise<Comment | undefined> {
    const existingComment = this.comments.get(id);
    if (!existingComment) {
      return undefined;
    }
    
    const updatedComment = { ...existingComment, content };
    this.comments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteComment(id: number): Promise<boolean> {
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
}

export const storage = new MemStorage();
