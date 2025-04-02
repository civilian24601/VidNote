import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  users, User, InsertUser,
  videos, Video, InsertVideo,
  comments, Comment, InsertComment,
  videoSharing, VideoSharing, InsertVideoSharing,
  studentTeacherRelationships, StudentTeacherRelationship, InsertStudentTeacherRelationship,
  notifications, Notification, InsertNotification,
  guestInvitations, GuestInvitation, InsertGuestInvitation
} from "@shared/schema";
import { IStorage } from '../storage';

// Create custom logger
import { createCustomLogger } from './logger';
const logger = createCustomLogger();

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;

  constructor(supabaseClient: SupabaseClient, supabaseAdminClient: SupabaseClient) {
    this.supabase = supabaseClient;
    this.supabaseAdmin = supabaseAdminClient;
    logger.supabase.info('SupabaseStorage initialized');
  }

  /**
   * User operations
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      logger.supabase.debug(`Getting user with ID: ${id}`);
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.supabase.error(`Error getting user with ID ${id}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No user found with ID: ${id}`);
        return undefined;
      }

      return data as User;
    } catch (error) {
      logger.supabase.error(`Exception getting user with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      logger.supabase.debug(`Getting user with username: ${username}`);
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        logger.supabase.error(`Error getting user with username ${username}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No user found with username: ${username}`);
        return undefined;
      }

      return data as User;
    } catch (error) {
      logger.supabase.error(`Exception getting user with username ${username}:`, { error });
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      logger.supabase.debug(`Getting user with email: ${email}`);
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        logger.supabase.error(`Error getting user with email ${email}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No user found with email: ${email}`);
        return undefined;
      }

      return data as User;
    } catch (error) {
      logger.supabase.error(`Exception getting user with email ${email}:`, { error });
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      logger.supabase.debug(`Creating new user with email: ${user.email}`);
      const { data, error } = await this.supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error creating user:`, { error, user });
        throw new Error(`Failed to create user: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('User created but no data returned');
        throw new Error('User created but no data returned');
      }

      logger.supabase.info(`User created with ID: ${data.id}`);
      return data as User;
    } catch (error) {
      logger.supabase.error(`Exception creating user:`, { error, user });
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      logger.supabase.debug(`Updating user with ID: ${id}`);
      const { data, error } = await this.supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error updating user with ID ${id}:`, { error, userData });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No user found to update with ID: ${id}`);
        return undefined;
      }

      logger.supabase.info(`User updated: ${id}`);
      return data as User;
    } catch (error) {
      logger.supabase.error(`Exception updating user with ID ${id}:`, { error, userData });
      return undefined;
    }
  }

  async verifyUser(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Verifying user with ID: ${id}`);
      const { error } = await this.supabase
        .from('users')
        .update({ verified: true })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error verifying user with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.info(`User verified: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception verifying user with ID ${id}:`, { error });
      return false;
    }
  }

  async updateLastLogin(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Updating last login for user with ID: ${id}`);
      const { error } = await this.supabase
        .from('users')
        .update({ lastLogin: new Date() })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error updating last login for user with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.debug(`Last login updated for user: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception updating last login for user with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Video operations
   */
  async getVideo(id: number): Promise<Video | undefined> {
    try {
      logger.supabase.debug(`Getting video with ID: ${id}`);
      const { data, error } = await this.supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.supabase.error(`Error getting video with ID ${id}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No video found with ID: ${id}`);
        return undefined;
      }

      return data as Video;
    } catch (error) {
      logger.supabase.error(`Exception getting video with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getVideosByUser(userId: number): Promise<Video[]> {
    try {
      logger.supabase.debug(`Getting videos for user with ID: ${userId}`);
      const { data, error } = await this.supabase
        .from('videos')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        logger.supabase.error(`Error getting videos for user with ID ${userId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No videos found for user with ID: ${userId}`);
        return [];
      }

      return data as Video[];
    } catch (error) {
      logger.supabase.error(`Exception getting videos for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async getSharedVideosForUser(userId: number): Promise<Video[]> {
    try {
      logger.supabase.debug(`Getting shared videos for user with ID: ${userId}`);
      const { data, error } = await this.supabase
        .from('video_sharing')
        .select('videoId')
        .eq('userId', userId);

      if (error) {
        logger.supabase.error(`Error getting video sharings for user with ID ${userId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No video sharings found for user with ID: ${userId}`);
        return [];
      }

      // Extract video IDs from sharings
      const videoIds = data.map(sharing => sharing.videoId);

      // Get videos by IDs
      const { data: videos, error: videosError } = await this.supabase
        .from('videos')
        .select('*')
        .in('id', videoIds)
        .order('createdAt', { ascending: false });

      if (videosError) {
        logger.supabase.error(`Error getting shared videos by IDs for user ${userId}:`, { error: videosError });
        return [];
      }

      if (!videos || videos.length === 0) {
        logger.supabase.debug(`No shared videos found for user with ID: ${userId}`);
        return [];
      }

      return videos as Video[];
    } catch (error) {
      logger.supabase.error(`Exception getting shared videos for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async createVideo(video: InsertVideo): Promise<Video> {
    try {
      logger.supabase.debug(`Creating new video: ${video.title}`);
      
      // Ensure URL format is correct for Supabase storage
      if (video.url && video.url.includes('/storage/v1/object/public/public/')) {
        // Fix double "public" in URL
        video.url = video.url.replace('/storage/v1/object/public/public/', '/storage/v1/object/public/');
        logger.supabase.info(`Fixed URL format: ${video.url}`);
      }
      
      const { data, error } = await this.supabase
        .from('videos')
        .insert(video)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error creating video:`, { error, video });
        throw new Error(`Failed to create video: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('Video created but no data returned');
        throw new Error('Video created but no data returned');
      }

      logger.supabase.info(`Video created with ID: ${data.id}`);
      return data as Video;
    } catch (error) {
      logger.supabase.error(`Exception creating video:`, { error, video });
      throw error;
    }
  }

  async updateVideo(id: number, videoData: Partial<InsertVideo>): Promise<Video | undefined> {
    try {
      logger.supabase.debug(`Updating video with ID: ${id}`);
      
      // Ensure URL format is correct for Supabase storage
      if (videoData.url && videoData.url.includes('/storage/v1/object/public/public/')) {
        // Fix double "public" in URL
        videoData.url = videoData.url.replace('/storage/v1/object/public/public/', '/storage/v1/object/public/');
        logger.supabase.info(`Fixed URL format in update: ${videoData.url}`);
      }
      
      const { data, error } = await this.supabase
        .from('videos')
        .update(videoData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error updating video with ID ${id}:`, { error, videoData });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No video found to update with ID: ${id}`);
        return undefined;
      }

      logger.supabase.info(`Video updated: ${id}`);
      return data as Video;
    } catch (error) {
      logger.supabase.error(`Exception updating video with ID ${id}:`, { error, videoData });
      return undefined;
    }
  }

  async deleteVideo(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Deleting video with ID: ${id}`);
      
      // Get the video to find its URL
      const { data: video, error: getError } = await this.supabase
        .from('videos')
        .select('url')
        .eq('id', id)
        .single();
        
      if (getError) {
        logger.supabase.error(`Error getting video before deletion, ID ${id}:`, { error: getError });
      }
      
      // Delete the video record
      const { error } = await this.supabase
        .from('videos')
        .delete()
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error deleting video with ID ${id}:`, { error });
        return false;
      }
      
      // If we found a URL, try to delete the file from storage
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
            
            logger.supabase.debug(`Deleting file from storage: bucket=${bucket}, path=${path}`);
            const { error: storageError } = await this.supabase.storage
              .from(bucket)
              .remove([path]);
              
            if (storageError) {
              logger.supabase.error(`Error deleting file from storage:`, { error: storageError, bucket, path });
            } else {
              logger.supabase.info(`Successfully deleted file from storage: ${bucket}/${path}`);
            }
          }
        } catch (storageError) {
          logger.supabase.error(`Exception deleting file from storage:`, { error: storageError, url: video.url });
        }
      }

      logger.supabase.info(`Video deleted: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception deleting video with ID ${id}:`, { error });
      return false;
    }
  }

  async incrementVideoViews(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Incrementing views for video with ID: ${id}`);
      
      // Get current view count
      const { data: video, error: getError } = await this.supabase
        .from('videos')
        .select('viewCount')
        .eq('id', id)
        .single();
        
      if (getError) {
        logger.supabase.error(`Error getting video view count, ID ${id}:`, { error: getError });
        return false;
      }
      
      if (!video) {
        logger.supabase.debug(`No video found with ID: ${id}`);
        return false;
      }
      
      // Increment view count
      const { error } = await this.supabase
        .from('videos')
        .update({ viewCount: (video.viewCount || 0) + 1 })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error incrementing views for video with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.debug(`Views incremented for video: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception incrementing views for video with ID ${id}:`, { error });
      return false;
    }
  }

  async updateVideoStatus(id: number, status: string): Promise<boolean> {
    try {
      logger.supabase.debug(`Updating status to "${status}" for video with ID: ${id}`);
      const { error } = await this.supabase
        .from('videos')
        .update({ videoStatus: status })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error updating status for video with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.info(`Video status updated to "${status}" for ID: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception updating status for video with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Comment operations
   */
  async getComment(id: number): Promise<Comment | undefined> {
    try {
      logger.supabase.debug(`Getting comment with ID: ${id}`);
      const { data, error } = await this.supabase
        .from('comments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.supabase.error(`Error getting comment with ID ${id}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No comment found with ID: ${id}`);
        return undefined;
      }

      return data as Comment;
    } catch (error) {
      logger.supabase.error(`Exception getting comment with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getCommentsByVideo(videoId: number): Promise<Comment[]> {
    try {
      logger.supabase.debug(`Getting comments for video with ID: ${videoId}`);
      const { data, error } = await this.supabase
        .from('comments')
        .select('*')
        .eq('videoId', videoId)
        .is('parentCommentId', null) // Get only top-level comments
        .order('timestamp', { ascending: true });

      if (error) {
        logger.supabase.error(`Error getting comments for video with ID ${videoId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No comments found for video with ID: ${videoId}`);
        return [];
      }

      return data as Comment[];
    } catch (error) {
      logger.supabase.error(`Exception getting comments for video with ID ${videoId}:`, { error });
      return [];
    }
  }

  async getRepliesByComment(commentId: number): Promise<Comment[]> {
    try {
      logger.supabase.debug(`Getting replies for comment with ID: ${commentId}`);
      const { data, error } = await this.supabase
        .from('comments')
        .select('*')
        .eq('parentCommentId', commentId)
        .order('createdAt', { ascending: true });

      if (error) {
        logger.supabase.error(`Error getting replies for comment with ID ${commentId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No replies found for comment with ID: ${commentId}`);
        return [];
      }

      return data as Comment[];
    } catch (error) {
      logger.supabase.error(`Exception getting replies for comment with ID ${commentId}:`, { error });
      return [];
    }
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    try {
      logger.supabase.debug(`Creating new comment for video ID: ${comment.videoId}`);
      const { data, error } = await this.supabase
        .from('comments')
        .insert(comment)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error creating comment:`, { error, comment });
        throw new Error(`Failed to create comment: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('Comment created but no data returned');
        throw new Error('Comment created but no data returned');
      }

      logger.supabase.info(`Comment created with ID: ${data.id}`);
      return data as Comment;
    } catch (error) {
      logger.supabase.error(`Exception creating comment:`, { error, comment });
      throw error;
    }
  }

  async updateComment(id: number, content: string, category?: string): Promise<Comment | undefined> {
    try {
      logger.supabase.debug(`Updating comment with ID: ${id}`);
      const updateData: any = { content };
      if (category) {
        updateData.category = category;
      }
      
      const { data, error } = await this.supabase
        .from('comments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error updating comment with ID ${id}:`, { error, content, category });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No comment found to update with ID: ${id}`);
        return undefined;
      }

      logger.supabase.info(`Comment updated: ${id}`);
      return data as Comment;
    } catch (error) {
      logger.supabase.error(`Exception updating comment with ID ${id}:`, { error, content, category });
      return undefined;
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Deleting comment with ID: ${id}`);
      
      // Also delete any replies to this comment
      const { error: repliesError } = await this.supabase
        .from('comments')
        .delete()
        .eq('parentCommentId', id);
        
      if (repliesError) {
        logger.supabase.error(`Error deleting replies for comment with ID ${id}:`, { error: repliesError });
      }
      
      // Delete the main comment
      const { error } = await this.supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error deleting comment with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.info(`Comment deleted: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception deleting comment with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Video sharing operations
   */
  async shareVideo(sharing: InsertVideoSharing): Promise<VideoSharing> {
    try {
      logger.supabase.debug(`Sharing video ID ${sharing.videoId} with user ID: ${sharing.userId}`);
      const { data, error } = await this.supabase
        .from('video_sharing')
        .insert(sharing)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error sharing video:`, { error, sharing });
        throw new Error(`Failed to share video: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('Video sharing created but no data returned');
        throw new Error('Video sharing created but no data returned');
      }

      logger.supabase.info(`Video shared: ${sharing.videoId} with user ${sharing.userId}`);
      return data as VideoSharing;
    } catch (error) {
      logger.supabase.error(`Exception sharing video:`, { error, sharing });
      throw error;
    }
  }

  async getVideoSharingsByVideo(videoId: number): Promise<VideoSharing[]> {
    try {
      logger.supabase.debug(`Getting sharing entries for video with ID: ${videoId}`);
      const { data, error } = await this.supabase
        .from('video_sharing')
        .select('*')
        .eq('videoId', videoId);

      if (error) {
        logger.supabase.error(`Error getting sharing entries for video with ID ${videoId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No sharing entries found for video with ID: ${videoId}`);
        return [];
      }

      return data as VideoSharing[];
    } catch (error) {
      logger.supabase.error(`Exception getting sharing entries for video with ID ${videoId}:`, { error });
      return [];
    }
  }

  async getVideoSharingsByUser(userId: number): Promise<VideoSharing[]> {
    try {
      logger.supabase.debug(`Getting videos shared with user ID: ${userId}`);
      const { data, error } = await this.supabase
        .from('video_sharing')
        .select('*')
        .eq('userId', userId);

      if (error) {
        logger.supabase.error(`Error getting videos shared with user ID ${userId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No videos shared with user ID: ${userId}`);
        return [];
      }

      return data as VideoSharing[];
    } catch (error) {
      logger.supabase.error(`Exception getting videos shared with user ID ${userId}:`, { error });
      return [];
    }
  }

  async unshareVideo(videoId: number, userId: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Unsharing video ID ${videoId} from user ID: ${userId}`);
      const { error } = await this.supabase
        .from('video_sharing')
        .delete()
        .eq('videoId', videoId)
        .eq('userId', userId);

      if (error) {
        logger.supabase.error(`Error unsharing video ID ${videoId} from user ID ${userId}:`, { error });
        return false;
      }

      logger.supabase.info(`Video unshared: ${videoId} from user ${userId}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception unsharing video ID ${videoId} from user ID ${userId}:`, { error });
      return false;
    }
  }

  async canUserAccessVideo(videoId: number, userId: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Checking if user ID ${userId} can access video ID: ${videoId}`);
      
      // Check if user is the owner
      const { data: video, error: videoError } = await this.supabase
        .from('videos')
        .select('userId')
        .eq('id', videoId)
        .single();
        
      if (videoError) {
        logger.supabase.error(`Error checking video owner for ID ${videoId}:`, { error: videoError });
        return false;
      }
      
      if (video && video.userId === userId) {
        logger.supabase.debug(`User ${userId} is the owner of video ${videoId}`);
        return true;
      }
      
      // Check if video is shared with user
      const { data: sharing, error: sharingError } = await this.supabase
        .from('video_sharing')
        .select('id')
        .eq('videoId', videoId)
        .eq('userId', userId)
        .single();
        
      if (sharingError && sharingError.code !== 'PGRST116') { // PGRST116 is "not found"
        logger.supabase.error(`Error checking video sharing for ID ${videoId}:`, { error: sharingError });
        return false;
      }
      
      if (sharing) {
        logger.supabase.debug(`Video ${videoId} is shared with user ${userId}`);
        return true;
      }
      
      logger.supabase.debug(`User ${userId} does not have access to video ${videoId}`);
      return false;
    } catch (error) {
      logger.supabase.error(`Exception checking if user ${userId} can access video ${videoId}:`, { error });
      return false;
    }
  }

  /**
   * Student-Teacher relationship operations
   */
  async createRelationship(relationship: InsertStudentTeacherRelationship): Promise<StudentTeacherRelationship> {
    try {
      logger.supabase.debug(`Creating relationship for student ID ${relationship.studentId} with teacher ID: ${relationship.teacherId}`);
      const { data, error } = await this.supabase
        .from('student_teacher_relationships')
        .insert(relationship)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error creating relationship:`, { error, relationship });
        throw new Error(`Failed to create relationship: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('Relationship created but no data returned');
        throw new Error('Relationship created but no data returned');
      }

      logger.supabase.info(`Relationship created with ID: ${data.id}`);
      return data as StudentTeacherRelationship;
    } catch (error) {
      logger.supabase.error(`Exception creating relationship:`, { error, relationship });
      throw error;
    }
  }

  async getRelationshipById(id: number): Promise<StudentTeacherRelationship | undefined> {
    try {
      logger.supabase.debug(`Getting relationship with ID: ${id}`);
      const { data, error } = await this.supabase
        .from('student_teacher_relationships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.supabase.error(`Error getting relationship with ID ${id}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No relationship found with ID: ${id}`);
        return undefined;
      }

      return data as StudentTeacherRelationship;
    } catch (error) {
      logger.supabase.error(`Exception getting relationship with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getRelationshipsByStudent(studentId: number): Promise<StudentTeacherRelationship[]> {
    try {
      logger.supabase.debug(`Getting relationships for student with ID: ${studentId}`);
      const { data, error } = await this.supabase
        .from('student_teacher_relationships')
        .select('*')
        .eq('studentId', studentId);

      if (error) {
        logger.supabase.error(`Error getting relationships for student with ID ${studentId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No relationships found for student with ID: ${studentId}`);
        return [];
      }

      return data as StudentTeacherRelationship[];
    } catch (error) {
      logger.supabase.error(`Exception getting relationships for student with ID ${studentId}:`, { error });
      return [];
    }
  }

  async getRelationshipsByTeacher(teacherId: number): Promise<StudentTeacherRelationship[]> {
    try {
      logger.supabase.debug(`Getting relationships for teacher with ID: ${teacherId}`);
      const { data, error } = await this.supabase
        .from('student_teacher_relationships')
        .select('*')
        .eq('teacherId', teacherId);

      if (error) {
        logger.supabase.error(`Error getting relationships for teacher with ID ${teacherId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No relationships found for teacher with ID: ${teacherId}`);
        return [];
      }

      return data as StudentTeacherRelationship[];
    } catch (error) {
      logger.supabase.error(`Exception getting relationships for teacher with ID ${teacherId}:`, { error });
      return [];
    }
  }

  async updateRelationshipStatus(id: number, status: string): Promise<boolean> {
    try {
      logger.supabase.debug(`Updating status to "${status}" for relationship with ID: ${id}`);
      const { error } = await this.supabase
        .from('student_teacher_relationships')
        .update({ status })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error updating status for relationship with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.info(`Relationship status updated to "${status}" for ID: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception updating status for relationship with ID ${id}:`, { error });
      return false;
    }
  }

  async deleteRelationship(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Deleting relationship with ID: ${id}`);
      const { error } = await this.supabase
        .from('student_teacher_relationships')
        .delete()
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error deleting relationship with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.info(`Relationship deleted: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception deleting relationship with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Notification operations
   */
  async createNotification(notification: InsertNotification): Promise<Notification> {
    try {
      logger.supabase.debug(`Creating notification for user ID: ${notification.userId}`);
      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error creating notification:`, { error, notification });
        throw new Error(`Failed to create notification: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('Notification created but no data returned');
        throw new Error('Notification created but no data returned');
      }

      logger.supabase.info(`Notification created with ID: ${data.id}`);
      return data as Notification;
    } catch (error) {
      logger.supabase.error(`Exception creating notification:`, { error, notification });
      throw error;
    }
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      logger.supabase.debug(`Getting notifications for user with ID: ${userId}`);
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        logger.supabase.error(`Error getting notifications for user with ID ${userId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No notifications found for user with ID: ${userId}`);
        return [];
      }

      return data as Notification[];
    } catch (error) {
      logger.supabase.error(`Exception getting notifications for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Marking notification with ID ${id} as read`);
      const { error } = await this.supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error marking notification with ID ${id} as read:`, { error });
        return false;
      }

      logger.supabase.debug(`Notification marked as read: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception marking notification with ID ${id} as read:`, { error });
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Marking all notifications for user ID ${userId} as read`);
      const { error } = await this.supabase
        .from('notifications')
        .update({ isRead: true })
        .eq('userId', userId)
        .eq('isRead', false);

      if (error) {
        logger.supabase.error(`Error marking all notifications for user ID ${userId} as read:`, { error });
        return false;
      }

      logger.supabase.debug(`All notifications marked as read for user: ${userId}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception marking all notifications for user ID ${userId} as read:`, { error });
      return false;
    }
  }

  /**
   * Guest Invitation operations
   */
  async createGuestInvitation(invitation: InsertGuestInvitation): Promise<GuestInvitation> {
    try {
      logger.supabase.debug(`Creating guest invitation for video ID: ${invitation.videoId}`);
      
      // Generate UUID token
      const token = uuidv4();
      
      const fullInvitation = {
        ...invitation,
        inviteToken: token,
        status: 'pending',
      };
      
      const { data, error } = await this.supabase
        .from('guest_invitations')
        .insert(fullInvitation)
        .select()
        .single();

      if (error) {
        logger.supabase.error(`Error creating guest invitation:`, { error, invitation });
        throw new Error(`Failed to create guest invitation: ${error.message}`);
      }

      if (!data) {
        logger.supabase.error('Guest invitation created but no data returned');
        throw new Error('Guest invitation created but no data returned');
      }

      logger.supabase.info(`Guest invitation created with ID: ${data.id}`);
      return data as GuestInvitation;
    } catch (error) {
      logger.supabase.error(`Exception creating guest invitation:`, { error, invitation });
      throw error;
    }
  }

  async getGuestInvitationByToken(token: string): Promise<GuestInvitation | undefined> {
    try {
      logger.supabase.debug(`Getting guest invitation with token: ${token}`);
      const { data, error } = await this.supabase
        .from('guest_invitations')
        .select('*')
        .eq('inviteToken', token)
        .single();

      if (error) {
        logger.supabase.error(`Error getting guest invitation with token ${token}:`, { error });
        return undefined;
      }

      if (!data) {
        logger.supabase.debug(`No guest invitation found with token: ${token}`);
        return undefined;
      }

      return data as GuestInvitation;
    } catch (error) {
      logger.supabase.error(`Exception getting guest invitation with token ${token}:`, { error });
      return undefined;
    }
  }

  async getGuestInvitationsByVideo(videoId: number): Promise<GuestInvitation[]> {
    try {
      logger.supabase.debug(`Getting guest invitations for video with ID: ${videoId}`);
      const { data, error } = await this.supabase
        .from('guest_invitations')
        .select('*')
        .eq('videoId', videoId)
        .order('createdAt', { ascending: false });

      if (error) {
        logger.supabase.error(`Error getting guest invitations for video with ID ${videoId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No guest invitations found for video with ID: ${videoId}`);
        return [];
      }

      return data as GuestInvitation[];
    } catch (error) {
      logger.supabase.error(`Exception getting guest invitations for video with ID ${videoId}:`, { error });
      return [];
    }
  }

  async getGuestInvitationsByStudent(studentId: number): Promise<GuestInvitation[]> {
    try {
      logger.supabase.debug(`Getting guest invitations for student with ID: ${studentId}`);
      const { data, error } = await this.supabase
        .from('guest_invitations')
        .select('*')
        .eq('studentId', studentId)
        .order('createdAt', { ascending: false });

      if (error) {
        logger.supabase.error(`Error getting guest invitations for student with ID ${studentId}:`, { error });
        return [];
      }

      if (!data || data.length === 0) {
        logger.supabase.debug(`No guest invitations found for student with ID: ${studentId}`);
        return [];
      }

      return data as GuestInvitation[];
    } catch (error) {
      logger.supabase.error(`Exception getting guest invitations for student with ID ${studentId}:`, { error });
      return [];
    }
  }

  async updateGuestInvitationStatus(id: number, status: string): Promise<boolean> {
    try {
      logger.supabase.debug(`Updating status to "${status}" for guest invitation with ID: ${id}`);
      const { error } = await this.supabase
        .from('guest_invitations')
        .update({ status })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error updating status for guest invitation with ID ${id}:`, { error });
        return false;
      }

      logger.supabase.info(`Guest invitation status updated to "${status}" for ID: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception updating status for guest invitation with ID ${id}:`, { error });
      return false;
    }
  }

  async markGuestInvitationUsed(id: number): Promise<boolean> {
    try {
      logger.supabase.debug(`Marking guest invitation with ID ${id} as used`);
      const { error } = await this.supabase
        .from('guest_invitations')
        .update({ 
          usedAt: new Date(),
          status: 'used'
        })
        .eq('id', id);

      if (error) {
        logger.supabase.error(`Error marking guest invitation with ID ${id} as used:`, { error });
        return false;
      }

      logger.supabase.info(`Guest invitation marked as used: ${id}`);
      return true;
    } catch (error) {
      logger.supabase.error(`Exception marking guest invitation with ID ${id} as used:`, { error });
      return false;
    }
  }
}