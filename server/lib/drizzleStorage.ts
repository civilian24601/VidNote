import { eq, and, isNull, desc, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import db from './drizzleDb';
import { 
  users, videos, comments, videoSharing, 
  studentTeacherRelationships, notifications, guestInvitations,
  type User, type InsertUser, type Video, type InsertVideo, 
  type Comment, type InsertComment, type VideoSharing, type InsertVideoSharing,
  type StudentTeacherRelationship, type InsertStudentTeacherRelationship,
  type Notification, type InsertNotification, type GuestInvitation, type InsertGuestInvitation
} from '../../shared/schema';

import { IStorage } from '../storage';
import { createCustomLogger } from './logger';

const logger = createCustomLogger();

/**
 * Implementation of the storage interface using Drizzle ORM with PostgreSQL
 */
export class DrizzleStorage implements IStorage {
  
  /**
   * User operations
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      logger.drizzle.debug(`Getting user with ID: ${id}`);
      const result = await db.select().from(users).where(eq(users.id, id));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No user found with ID: ${id}`);
        return undefined;
      }
      
      return result[0] as User;
    } catch (error) {
      logger.drizzle.error(`Error getting user with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      logger.drizzle.debug(`Getting user with username: ${username}`);
      const result = await db.select().from(users).where(eq(users.username, username));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No user found with username: ${username}`);
        return undefined;
      }
      
      return result[0] as User;
    } catch (error) {
      logger.drizzle.error(`Error getting user with username ${username}:`, { error });
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      logger.drizzle.debug(`Getting user with email: ${email}`);
      const result = await db.select().from(users).where(eq(users.email, email));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No user found with email: ${email}`);
        return undefined;
      }
      
      return result[0] as User;
    } catch (error) {
      logger.drizzle.error(`Error getting user with email ${email}:`, { error });
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      logger.drizzle.debug(`Creating new user with email: ${userData.email}`);
      // Convert instruments array to proper format if it exists
      const preparedUserData: any = { ...userData };
      if (preparedUserData.instruments && Array.isArray(preparedUserData.instruments)) {
        preparedUserData.instruments = preparedUserData.instruments;
      }
      
      const result = await db.insert(users).values([preparedUserData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('User created but no data returned');
        throw new Error('User created but no data returned');
      }
      
      logger.drizzle.info(`User created with ID: ${result[0].id}`);
      return result[0] as User;
    } catch (error) {
      logger.drizzle.error(`Error creating user:`, { error, userData });
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    try {
      logger.drizzle.debug(`Updating user with ID: ${id}`);
      
      // Handle special case for instruments array
      const preparedUserData: any = { ...userData };
      if (preparedUserData.instruments) {
        if (Array.isArray(preparedUserData.instruments)) {
          // Keep it as is - already an array
        } else if (preparedUserData.instruments === null) {
          // Set to null
          preparedUserData.instruments = null;
        } else {
          // Remove problematic field if it's not in the right format
          delete preparedUserData.instruments;
          logger.drizzle.warn(`Removed instruments from update for user ${id} due to incorrect format`);
        }
      }
      
      const result = await db.update(users)
        .set(preparedUserData)
        .where(eq(users.id, id))
        .returning();
      
      if (result.length === 0) {
        logger.drizzle.debug(`No user found to update with ID: ${id}`);
        return undefined;
      }
      
      logger.drizzle.info(`User updated: ${id}`);
      return result[0] as User;
    } catch (error) {
      logger.drizzle.error(`Error updating user with ID ${id}:`, { error, userData });
      return undefined;
    }
  }

  async verifyUser(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Verifying user with ID: ${id}`);
      const result = await db.update(users)
        .set({ verified: true })
        .where(eq(users.id, id))
        .returning({ id: users.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No user found to verify with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`User verified: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error verifying user with ID ${id}:`, { error });
      return false;
    }
  }

  async updateLastLogin(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Updating last login for user with ID: ${id}`);
      const result = await db.update(users)
        .set({ lastLogin: new Date() })
        .where(eq(users.id, id))
        .returning({ id: users.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No user found to update last login with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.debug(`Last login updated for user: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error updating last login for user with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Video operations
   */
  async getVideo(id: number): Promise<Video | undefined> {
    try {
      logger.drizzle.debug(`Getting video with ID: ${id}`);
      const result = await db.select().from(videos).where(eq(videos.id, id));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No video found with ID: ${id}`);
        return undefined;
      }
      
      return result[0] as Video;
    } catch (error) {
      logger.drizzle.error(`Error getting video with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getVideosByUser(userId: number): Promise<Video[]> {
    try {
      logger.drizzle.debug(`Getting videos for user with ID: ${userId}`);
      const result = await db.select()
        .from(videos)
        .where(eq(videos.userId, userId))
        .orderBy(desc(videos.createdAt));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No videos found for user with ID: ${userId}`);
        return [];
      }
      
      return result as Video[];
    } catch (error) {
      logger.drizzle.error(`Error getting videos for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async getSharedVideosForUser(userId: number): Promise<Video[]> {
    try {
      logger.drizzle.debug(`Getting shared videos for user with ID: ${userId}`);
      // First get all video IDs shared with this user
      const sharingResult = await db.select({ videoId: videoSharing.videoId })
        .from(videoSharing)
        .where(eq(videoSharing.userId, userId));
      
      if (sharingResult.length === 0) {
        logger.drizzle.debug(`No video sharings found for user with ID: ${userId}`);
        return [];
      }
      
      // Extract video IDs
      const videoIds = sharingResult.map(sharing => sharing.videoId);
      
      // Then get the videos
      const result = await db.select()
        .from(videos)
        .where(inArray(videos.id, videoIds))
        .orderBy(desc(videos.createdAt));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No shared videos found for user with ID: ${userId}`);
        return [];
      }
      
      return result as Video[];
    } catch (error) {
      logger.drizzle.error(`Error getting shared videos for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async createVideo(videoData: InsertVideo): Promise<Video> {
    try {
      logger.drizzle.debug(`Creating new video: ${videoData.title}`);
      
      // Ensure URL format is correct for Supabase storage
      if (videoData.url && videoData.url.includes('/storage/v1/object/public/public/')) {
        // Fix double "public" in URL
        videoData.url = videoData.url.replace('/storage/v1/object/public/public/', '/storage/v1/object/public/');
        logger.drizzle.info(`Fixed URL format: ${videoData.url}`);
      }
      
      const result = await db.insert(videos).values([videoData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('Video created but no data returned');
        throw new Error('Video created but no data returned');
      }
      
      logger.drizzle.info(`Video created with ID: ${result[0].id}`);
      return result[0] as Video;
    } catch (error) {
      logger.drizzle.error(`Error creating video:`, { error, videoData });
      throw error;
    }
  }

  async updateVideo(id: number, videoData: Partial<InsertVideo>): Promise<Video | undefined> {
    try {
      logger.drizzle.debug(`Updating video with ID: ${id}`);
      
      // Ensure URL format is correct for Supabase storage
      if (videoData.url && videoData.url.includes('/storage/v1/object/public/public/')) {
        // Fix double "public" in URL
        videoData.url = videoData.url.replace('/storage/v1/object/public/public/', '/storage/v1/object/public/');
        logger.drizzle.info(`Fixed URL format in update: ${videoData.url}`);
      }
      
      const result = await db.update(videos)
        .set(videoData)
        .where(eq(videos.id, id))
        .returning();
      
      if (result.length === 0) {
        logger.drizzle.debug(`No video found to update with ID: ${id}`);
        return undefined;
      }
      
      logger.drizzle.info(`Video updated: ${id}`);
      return result[0] as Video;
    } catch (error) {
      logger.drizzle.error(`Error updating video with ID ${id}:`, { error, videoData });
      return undefined;
    }
  }

  async deleteVideo(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Deleting video with ID: ${id}`);
      
      // Get the video to find its URL
      const videoResult = await db.select({ url: videos.url })
        .from(videos)
        .where(eq(videos.id, id));
      
      // Delete the video record
      const result = await db.delete(videos)
        .where(eq(videos.id, id))
        .returning({ id: videos.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No video found to delete with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Video deleted: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error deleting video with ID ${id}:`, { error });
      return false;
    }
  }

  async incrementVideoViews(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Incrementing views for video with ID: ${id}`);
      
      // Get current view count
      const videoResult = await db.select({ viewCount: videos.viewCount })
        .from(videos)
        .where(eq(videos.id, id));
      
      if (videoResult.length === 0) {
        logger.drizzle.debug(`No video found with ID: ${id}`);
        return false;
      }
      
      // Increment view count
      const currentCount = videoResult[0].viewCount || 0;
      const result = await db.update(videos)
        .set({ viewCount: currentCount + 1 })
        .where(eq(videos.id, id))
        .returning({ id: videos.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`Failed to increment view count for video: ${id}`);
        return false;
      }
      
      logger.drizzle.debug(`Views incremented for video: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error incrementing views for video with ID ${id}:`, { error });
      return false;
    }
  }

  async updateVideoStatus(id: number, status: string): Promise<boolean> {
    try {
      logger.drizzle.debug(`Updating status to "${status}" for video with ID: ${id}`);
      const result = await db.update(videos)
        .set({ videoStatus: status })
        .where(eq(videos.id, id))
        .returning({ id: videos.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No video found to update status with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Video status updated to "${status}" for ID: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error updating status for video with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Comment operations
   */
  async getComment(id: number): Promise<Comment | undefined> {
    try {
      logger.drizzle.debug(`Getting comment with ID: ${id}`);
      const result = await db.select().from(comments).where(eq(comments.id, id));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No comment found with ID: ${id}`);
        return undefined;
      }
      
      return result[0] as Comment;
    } catch (error) {
      logger.drizzle.error(`Error getting comment with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getCommentsByVideo(videoId: number): Promise<Comment[]> {
    try {
      logger.drizzle.debug(`Getting comments for video with ID: ${videoId}`);
      const result = await db.select()
        .from(comments)
        .where(
          and(
            eq(comments.videoId, videoId),
            isNull(comments.parentCommentId)
          )
        )
        .orderBy(comments.timestamp);
      
      return result as Comment[];
    } catch (error) {
      logger.drizzle.error(`Error getting comments for video with ID ${videoId}:`, { error });
      return [];
    }
  }

  async getRepliesByComment(commentId: number): Promise<Comment[]> {
    try {
      logger.drizzle.debug(`Getting replies for comment with ID: ${commentId}`);
      const result = await db.select()
        .from(comments)
        .where(eq(comments.parentCommentId, commentId))
        .orderBy(comments.createdAt);
      
      return result as Comment[];
    } catch (error) {
      logger.drizzle.error(`Error getting replies for comment with ID ${commentId}:`, { error });
      return [];
    }
  }

  async createComment(commentData: InsertComment): Promise<Comment> {
    try {
      logger.drizzle.debug(`Creating new comment for video ID: ${commentData.videoId}`);
      const result = await db.insert(comments).values([commentData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('Comment created but no data returned');
        throw new Error('Comment created but no data returned');
      }
      
      logger.drizzle.info(`Comment created with ID: ${result[0].id}`);
      return result[0] as Comment;
    } catch (error) {
      logger.drizzle.error(`Error creating comment:`, { error, commentData });
      throw error;
    }
  }

  async updateComment(id: number, content: string, category?: string): Promise<Comment | undefined> {
    try {
      logger.drizzle.debug(`Updating comment with ID: ${id}`);
      const result = await db.update(comments)
        .set({ content, category })
        .where(eq(comments.id, id))
        .returning();
      
      if (result.length === 0) {
        logger.drizzle.debug(`No comment found to update with ID: ${id}`);
        return undefined;
      }
      
      logger.drizzle.info(`Comment updated: ${id}`);
      return result[0] as Comment;
    } catch (error) {
      logger.drizzle.error(`Error updating comment with ID ${id}:`, { error, content, category });
      return undefined;
    }
  }

  async deleteComment(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Deleting comment with ID: ${id}`);
      const result = await db.delete(comments)
        .where(eq(comments.id, id))
        .returning({ id: comments.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No comment found to delete with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Comment deleted: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error deleting comment with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Video sharing operations
   */
  async shareVideo(sharingData: InsertVideoSharing): Promise<VideoSharing> {
    try {
      logger.drizzle.debug(`Sharing video ID ${sharingData.videoId} with user ID ${sharingData.userId}`);
      const result = await db.insert(videoSharing).values([sharingData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('Video sharing created but no data returned');
        throw new Error('Video sharing created but no data returned');
      }
      
      logger.drizzle.info(`Video sharing created with ID: ${result[0].id}`);
      return result[0] as VideoSharing;
    } catch (error) {
      logger.drizzle.error(`Error sharing video:`, { error, sharingData });
      throw error;
    }
  }

  async getVideoSharingsByVideo(videoId: number): Promise<VideoSharing[]> {
    try {
      logger.drizzle.debug(`Getting sharings for video with ID: ${videoId}`);
      const result = await db.select()
        .from(videoSharing)
        .where(eq(videoSharing.videoId, videoId));
      
      return result as VideoSharing[];
    } catch (error) {
      logger.drizzle.error(`Error getting sharings for video with ID ${videoId}:`, { error });
      return [];
    }
  }

  async getVideoSharingsByUser(userId: number): Promise<VideoSharing[]> {
    try {
      logger.drizzle.debug(`Getting sharings for user with ID: ${userId}`);
      const result = await db.select()
        .from(videoSharing)
        .where(eq(videoSharing.userId, userId));
      
      return result as VideoSharing[];
    } catch (error) {
      logger.drizzle.error(`Error getting sharings for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async unshareVideo(videoId: number, userId: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Unsharing video ID ${videoId} from user ID ${userId}`);
      const result = await db.delete(videoSharing)
        .where(
          and(
            eq(videoSharing.videoId, videoId),
            eq(videoSharing.userId, userId)
          )
        )
        .returning({ id: videoSharing.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No video sharing found to delete for video ${videoId} and user ${userId}`);
        return false;
      }
      
      logger.drizzle.info(`Video unshared: video ${videoId} from user ${userId}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error unsharing video ${videoId} from user ${userId}:`, { error });
      return false;
    }
  }

  async canUserAccessVideo(videoId: number, userId: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Checking if user ${userId} can access video ${videoId}`);
      
      // Check if user is the owner of the video
      const videoResult = await db.select()
        .from(videos)
        .where(
          and(
            eq(videos.id, videoId),
            eq(videos.userId, userId)
          )
        );
      
      if (videoResult.length > 0) {
        logger.drizzle.debug(`User ${userId} is the owner of video ${videoId}`);
        return true;
      }
      
      // Check if video is shared with the user
      const sharingResult = await db.select()
        .from(videoSharing)
        .where(
          and(
            eq(videoSharing.videoId, videoId),
            eq(videoSharing.userId, userId)
          )
        );
      
      if (sharingResult.length > 0) {
        logger.drizzle.debug(`Video ${videoId} is shared with user ${userId}`);
        return true;
      }
      
      // Check if the video is public
      const publicResult = await db.select({ isPublic: videos.isPublic })
        .from(videos)
        .where(eq(videos.id, videoId));
      
      if (publicResult.length > 0 && publicResult[0].isPublic) {
        logger.drizzle.debug(`Video ${videoId} is public`);
        return true;
      }
      
      logger.drizzle.debug(`User ${userId} cannot access video ${videoId}`);
      return false;
    } catch (error) {
      logger.drizzle.error(`Error checking access for user ${userId} to video ${videoId}:`, { error });
      return false;
    }
  }

  /**
   * Student-Teacher relationship operations
   */
  async createRelationship(relationshipData: InsertStudentTeacherRelationship): Promise<StudentTeacherRelationship> {
    try {
      logger.drizzle.debug(`Creating relationship between student ${relationshipData.studentId} and teacher ${relationshipData.teacherId}`);
      const result = await db.insert(studentTeacherRelationships).values([relationshipData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('Relationship created but no data returned');
        throw new Error('Relationship created but no data returned');
      }
      
      logger.drizzle.info(`Relationship created with ID: ${result[0].id}`);
      return result[0] as StudentTeacherRelationship;
    } catch (error) {
      logger.drizzle.error(`Error creating relationship:`, { error, relationshipData });
      throw error;
    }
  }

  async getRelationshipById(id: number): Promise<StudentTeacherRelationship | undefined> {
    try {
      logger.drizzle.debug(`Getting relationship with ID: ${id}`);
      const result = await db.select()
        .from(studentTeacherRelationships)
        .where(eq(studentTeacherRelationships.id, id));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No relationship found with ID: ${id}`);
        return undefined;
      }
      
      return result[0] as StudentTeacherRelationship;
    } catch (error) {
      logger.drizzle.error(`Error getting relationship with ID ${id}:`, { error });
      return undefined;
    }
  }

  async getRelationshipsByStudent(studentId: number): Promise<StudentTeacherRelationship[]> {
    try {
      logger.drizzle.debug(`Getting relationships for student with ID: ${studentId}`);
      const result = await db.select()
        .from(studentTeacherRelationships)
        .where(eq(studentTeacherRelationships.studentId, studentId));
      
      return result as StudentTeacherRelationship[];
    } catch (error) {
      logger.drizzle.error(`Error getting relationships for student with ID ${studentId}:`, { error });
      return [];
    }
  }

  async getRelationshipsByTeacher(teacherId: number): Promise<StudentTeacherRelationship[]> {
    try {
      logger.drizzle.debug(`Getting relationships for teacher with ID: ${teacherId}`);
      const result = await db.select()
        .from(studentTeacherRelationships)
        .where(eq(studentTeacherRelationships.teacherId, teacherId));
      
      return result as StudentTeacherRelationship[];
    } catch (error) {
      logger.drizzle.error(`Error getting relationships for teacher with ID ${teacherId}:`, { error });
      return [];
    }
  }

  async updateRelationshipStatus(id: number, status: string): Promise<boolean> {
    try {
      logger.drizzle.debug(`Updating status to "${status}" for relationship with ID: ${id}`);
      const result = await db.update(studentTeacherRelationships)
        .set({ status })
        .where(eq(studentTeacherRelationships.id, id))
        .returning({ id: studentTeacherRelationships.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No relationship found to update status with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Relationship status updated to "${status}" for ID: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error updating status for relationship with ID ${id}:`, { error });
      return false;
    }
  }

  async deleteRelationship(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Deleting relationship with ID: ${id}`);
      const result = await db.delete(studentTeacherRelationships)
        .where(eq(studentTeacherRelationships.id, id))
        .returning({ id: studentTeacherRelationships.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No relationship found to delete with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Relationship deleted: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error deleting relationship with ID ${id}:`, { error });
      return false;
    }
  }

  /**
   * Notification operations
   */
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    try {
      logger.drizzle.debug(`Creating notification for user ID: ${notificationData.userId}`);
      const result = await db.insert(notifications).values([notificationData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('Notification created but no data returned');
        throw new Error('Notification created but no data returned');
      }
      
      logger.drizzle.info(`Notification created with ID: ${result[0].id}`);
      return result[0] as Notification;
    } catch (error) {
      logger.drizzle.error(`Error creating notification:`, { error, notificationData });
      throw error;
    }
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    try {
      logger.drizzle.debug(`Getting notifications for user with ID: ${userId}`);
      const result = await db.select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt));
      
      return result as Notification[];
    } catch (error) {
      logger.drizzle.error(`Error getting notifications for user with ID ${userId}:`, { error });
      return [];
    }
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Marking notification with ID ${id} as read`);
      const result = await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id))
        .returning({ id: notifications.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No notification found to mark as read with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.debug(`Notification marked as read: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error marking notification with ID ${id} as read:`, { error });
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Marking all notifications for user ${userId} as read`);
      const result = await db.update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .returning({ id: notifications.id });
      
      logger.drizzle.debug(`Marked ${result.length} notifications as read for user ${userId}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error marking all notifications as read for user ${userId}:`, { error });
      return false;
    }
  }

  /**
   * Guest Invitation operations
   */
  async createGuestInvitation(invitationData: InsertGuestInvitation): Promise<GuestInvitation> {
    try {
      logger.drizzle.debug(`Creating guest invitation for video ID: ${invitationData.videoId}`);
      
      // Generate a random UUID for the invite token
      const inviteToken = crypto.randomUUID();
      
      // Add the invite token to the data
      const preparedData = {
        ...invitationData,
        inviteToken,
      };
      
      const result = await db.insert(guestInvitations).values([preparedData]).returning();
      
      if (result.length === 0) {
        logger.drizzle.error('Guest invitation created but no data returned');
        throw new Error('Guest invitation created but no data returned');
      }
      
      logger.drizzle.info(`Guest invitation created with ID: ${result[0].id}`);
      return result[0] as GuestInvitation;
    } catch (error) {
      logger.drizzle.error(`Error creating guest invitation:`, { error, invitationData });
      throw error;
    }
  }

  async getGuestInvitationByToken(token: string): Promise<GuestInvitation | undefined> {
    try {
      logger.drizzle.debug(`Getting guest invitation with token: ${token}`);
      const result = await db.select()
        .from(guestInvitations)
        .where(eq(guestInvitations.inviteToken, token));
      
      if (result.length === 0) {
        logger.drizzle.debug(`No guest invitation found with token: ${token}`);
        return undefined;
      }
      
      return result[0] as GuestInvitation;
    } catch (error) {
      logger.drizzle.error(`Error getting guest invitation with token ${token}:`, { error });
      return undefined;
    }
  }

  async getGuestInvitationsByVideo(videoId: number): Promise<GuestInvitation[]> {
    try {
      logger.drizzle.debug(`Getting guest invitations for video with ID: ${videoId}`);
      const result = await db.select()
        .from(guestInvitations)
        .where(eq(guestInvitations.videoId, videoId))
        .orderBy(desc(guestInvitations.createdAt));
      
      return result as GuestInvitation[];
    } catch (error) {
      logger.drizzle.error(`Error getting guest invitations for video with ID ${videoId}:`, { error });
      return [];
    }
  }

  async getGuestInvitationsByStudent(studentId: number): Promise<GuestInvitation[]> {
    try {
      logger.drizzle.debug(`Getting guest invitations for student with ID: ${studentId}`);
      const result = await db.select()
        .from(guestInvitations)
        .where(eq(guestInvitations.studentId, studentId))
        .orderBy(desc(guestInvitations.createdAt));
      
      return result as GuestInvitation[];
    } catch (error) {
      logger.drizzle.error(`Error getting guest invitations for student with ID ${studentId}:`, { error });
      return [];
    }
  }

  async updateGuestInvitationStatus(id: number, status: string): Promise<boolean> {
    try {
      logger.drizzle.debug(`Updating status to "${status}" for guest invitation with ID: ${id}`);
      const result = await db.update(guestInvitations)
        .set({ status })
        .where(eq(guestInvitations.id, id))
        .returning({ id: guestInvitations.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No guest invitation found to update status with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Guest invitation status updated to "${status}" for ID: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error updating status for guest invitation with ID ${id}:`, { error });
      return false;
    }
  }

  async markGuestInvitationUsed(id: number): Promise<boolean> {
    try {
      logger.drizzle.debug(`Marking guest invitation with ID ${id} as used`);
      const result = await db.update(guestInvitations)
        .set({ usedAt: new Date() })
        .where(eq(guestInvitations.id, id))
        .returning({ id: guestInvitations.id });
      
      if (result.length === 0) {
        logger.drizzle.debug(`No guest invitation found to mark as used with ID: ${id}`);
        return false;
      }
      
      logger.drizzle.info(`Guest invitation marked as used: ${id}`);
      return true;
    } catch (error) {
      logger.drizzle.error(`Error marking guest invitation with ID ${id} as used:`, { error });
      return false;
    }
  }
}

export default DrizzleStorage;