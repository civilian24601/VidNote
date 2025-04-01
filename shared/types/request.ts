import { User } from './models';
import { Request as ExpressRequest } from 'express';

// Extend the Express Request type to include the user property
export interface AuthenticatedRequest extends ExpressRequest {
  user?: User;
}

// Define common query parameters
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface VideoQuery extends PaginationQuery {
  userId?: number;
  isPublic?: boolean;
  search?: string;
}

export interface CommentQuery extends PaginationQuery {
  videoId?: number;
  userId?: number;
  parentCommentId?: number;
}

// Define common request body types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
}

export interface UpdateUserRequest {
  username?: string;
  fullName?: string;
  bio?: string;
  experienceLevel?: string;
  instruments?: string[];
  avatarUrl?: string;
}

export interface CreateVideoRequest {
  title: string;
  description?: string;
  pieceName?: string;
  composer?: string;
  practiceGoals?: string;
  isPublic: boolean;
  duration?: number;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  pieceName?: string;
  composer?: string;
  practiceGoals?: string;
  isPublic?: boolean;
}

export interface CreateCommentRequest {
  content: string;
  timestamp: number;
  videoId: number;
  category?: string;
  parentCommentId?: number;
}

export interface UpdateCommentRequest {
  content: string;
  category?: string;
}

export interface ShareVideoRequest {
  userId: number;
}

export interface CreateGuestInvitationRequest {
  videoId: number;
  email: string;
  guestName: string;
  message?: string;
  role?: string;
  expiresAt: Date;
}