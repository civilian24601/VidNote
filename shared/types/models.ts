// Import all model types from the schema file
import {
  User,
  InsertUser,
  Video,
  InsertVideo,
  Comment,
  InsertComment,
  VideoShare,
  InsertVideoShare,
  Relationship,
  InsertRelationship,
  Notification,
  InsertNotification
} from '../schema';

// Re-export types
export {
  User,
  InsertUser,
  Video,
  InsertVideo,
  Comment,
  InsertComment,
  VideoShare,
  InsertVideoShare,
  Relationship,
  InsertRelationship,
  Notification,
  InsertNotification
};

// Define extended types that might be used in the application
export interface CommentWithUser extends Comment {
  user?: Omit<User, 'password'>;
}

export interface VideoWithSharing extends Video {
  sharedWith?: Array<Omit<User, 'password'>>;
}

export interface VideoWithOwner extends Video {
  owner?: Omit<User, 'password'>;
}

export interface VideoShareWithUser extends VideoShare {
  user?: Omit<User, 'password'>;
}

export interface NotificationWithRelated extends Notification {
  relatedData?: any; // Replace with specific related types as needed
}

export type Role = 'student' | 'teacher' | 'adjudicator' | 'admin';

export type VideoStatus = 'processing' | 'ready' | 'error';

export type CommentCategory = 'technique' | 'interpretation' | 'expression' | 'rhythm' | 'general';

export type RelationshipStatus = 'pending' | 'accepted' | 'rejected';

export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export type NotificationType = 
  | 'new_comment' 
  | 'video_shared' 
  | 'new_student' 
  | 'new_teacher' 
  | 'guest_invitation';