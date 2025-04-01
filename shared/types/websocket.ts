// WebSocket message types for real-time communication

import { CommentWithUser } from './models';

// Base WebSocket message interface
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

// Message types for client -> server communication
export interface JoinRoomMessage extends WebSocketMessage {
  type: 'join';
  videoId: number;
  userId: number;
}

export interface LeaveRoomMessage extends WebSocketMessage {
  type: 'leave';
  videoId: number;
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

// Message types for server -> client communication
export interface JoinedRoomMessage extends WebSocketMessage {
  type: 'joined';
  videoId: number;
}

export interface UserJoinedMessage extends WebSocketMessage {
  type: 'user_joined';
  videoId: number;
  userId: number;
  username: string;
}

export interface UserLeftMessage extends WebSocketMessage {
  type: 'user_left';
  videoId: number;
  userId: number;
}

export interface CommentReceivedMessage extends WebSocketMessage {
  type: 'new_comment';
  videoId: number;
  comment: CommentWithUser;
}

export interface TypingIndicatorUpdateMessage extends WebSocketMessage {
  type: 'typing';
  videoId: number;
  userId: number;
  isTyping: boolean;
}

// Utility type for all possible WebSocket message types
export type WebSocketMessageTypes =
  | JoinRoomMessage
  | LeaveRoomMessage
  | NewCommentMessage
  | TypingIndicatorMessage
  | JoinedRoomMessage
  | UserJoinedMessage
  | UserLeftMessage
  | CommentReceivedMessage
  | TypingIndicatorUpdateMessage;