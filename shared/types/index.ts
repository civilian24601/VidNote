// Export the model types from schema
export * from '../schema';

// Import Request from express for extension
import { Request } from 'express';
import { User } from '../schema';

// Extend the Express Request type to include the user property
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Add a declaration to extend Express namespace
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// WebSocket message types for real-time communication
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface JoinRoomMessage extends WebSocketMessage {
  type: 'join';
  videoId: number;
  userId: number;
}

export interface NewCommentMessage extends WebSocketMessage {
  type: 'new_comment';
  videoId: number;
  comment: CommentWithUser;
}

export interface TypingIndicatorMessage extends WebSocketMessage {
  type: 'typing';
  videoId: number;
  userId: number;
  isTyping: boolean;
}

// Extended model types
export interface CommentWithUser {
  id: number;
  videoId: number;
  userId: number;
  content: string;
  timestamp: number;
  category?: string;
  parentCommentId?: number;
  createdAt: Date;
  updatedAt: Date;
  user?: Omit<User, 'password'>;
}

export interface VideoWithSharing {
  id: number;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  userId: number;
  pieceName?: string;
  composer?: string;
  practiceGoals?: string;
  isPublic: boolean;
  duration?: number;
  videoStatus: string;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  sharedWith?: Array<Omit<User, 'password'>>;
}

// Type literals for consistent usage
export type Role = 'student' | 'teacher' | 'adjudicator' | 'admin';
export type VideoStatus = 'processing' | 'ready' | 'error';
export type CommentCategory = 'technique' | 'interpretation' | 'expression' | 'rhythm' | 'general';
export type RelationshipStatus = 'pending' | 'accepted' | 'rejected';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';