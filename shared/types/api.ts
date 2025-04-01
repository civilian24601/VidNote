// API Response types for consistent frontend-backend communication

import { CommentWithUser, VideoWithOwner, VideoWithSharing, VideoSharingWithUser } from './models';

// Base API Response interface
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Success response creators
export const createSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => ({
  success: true,
  data,
  message
});

export const createPaginatedResponse = <T>(
  items: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => ({
  items,
  total,
  page,
  limit,
  hasMore: page * limit < total
});

// Error response creator
export const createErrorResponse = (error: string): ApiResponse<null> => ({
  success: false,
  error
});

// Specific API response types
export type UserResponse = ApiResponse<Omit<any, 'password'>>;
export type UsersResponse = ApiResponse<PaginatedResponse<Omit<any, 'password'>>>;

export type VideoResponse = ApiResponse<VideoWithOwner>;
export type VideosResponse = ApiResponse<PaginatedResponse<VideoWithOwner>>;

export type CommentResponse = ApiResponse<CommentWithUser>;
export type CommentsResponse = ApiResponse<PaginatedResponse<CommentWithUser>>;

export type VideoSharingResponse = ApiResponse<VideoSharingWithUser>;
export type VideoSharingsResponse = ApiResponse<PaginatedResponse<VideoSharingWithUser>>;

export type NotificationResponse = ApiResponse<any>;
export type NotificationsResponse = ApiResponse<PaginatedResponse<any>>;

export type GuestInvitationResponse = ApiResponse<any>;
export type GuestInvitationsResponse = ApiResponse<PaginatedResponse<any>>;