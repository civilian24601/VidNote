// This is a client-side duplicate of the server schema with types needed for client components

export interface User {
  id: number;
  fullName: string;
  email: string;
  username?: string;
  role: "student" | "teacher" | "admin";
  avatarUrl?: string | null;
  lastLogin?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Video {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  userId: number;
  status?: string;
  views?: number;
  pieceName?: string | null;
  composer?: string | null;
  difficulty?: string | null;
  practiceTime?: number | null;
  createdAt: Date | null;
  updatedAt?: Date | null;
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  videoId: number;
  timestamp?: number | null;
  category?: string | null;
  parentId?: number | null;
  createdAt: Date | null;
  updatedAt?: Date | null;
  user?: User;
  replies?: Comment[];
}

export interface VideoSharing {
  id: number;
  videoId: number;
  userId: number;
  createdAt: Date | null;
  customMessage?: string | null;
  user?: User;
}

export interface StudentTeacherRelationship {
  id: number;
  studentId: number;
  teacherId: number;
  status: string;
  createdAt: Date | null;
  updatedAt?: Date | null;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  content: string;
  isRead: boolean;
  type?: string | null;
  relatedId?: number | null;
  createdAt: Date | null;
}