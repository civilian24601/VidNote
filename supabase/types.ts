export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          full_name: string | null
          role: "student" | "teacher"
          instruments: string[] | null
          experience_level: string | null
          bio: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          full_name?: string | null
          role?: "student" | "teacher"
          instruments?: string[] | null
          experience_level?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          full_name?: string | null
          role?: "student" | "teacher"
          instruments?: string[] | null
          experience_level?: string | null
          bio?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          piece_name: string | null
          composer: string | null
          practice_goals: string | null
          url: string
          thumbnail_url: string | null
          duration: number | null
          is_public: boolean | null
          video_status: "processing" | "ready" | "error"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          piece_name?: string | null
          composer?: string | null
          practice_goals?: string | null
          url: string
          thumbnail_url?: string | null
          duration?: number | null
          is_public?: boolean | null
          video_status?: "processing" | "ready" | "error"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          piece_name?: string | null
          composer?: string | null
          practice_goals?: string | null
          url?: string
          thumbnail_url?: string | null
          duration?: number | null
          is_public?: boolean | null
          video_status?: "processing" | "ready" | "error"
          created_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          video_id: string
          user_id: string
          content: string
          timestamp: number
          category: string | null
          parent_comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          content: string
          timestamp: number
          category?: string | null
          parent_comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          content?: string
          timestamp?: number
          category?: string | null
          parent_comment_id?: string | null
          created_at?: string
        }
      }
      video_shares: {
        Row: {
          id: string
          video_id: string
          shared_with: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          shared_with: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          shared_with?: string
          created_at?: string
        }
      }
      relationships: {
        Row: {
          id: string
          student_id: string
          teacher_id: string
          status: "pending" | "active" | "declined"
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          teacher_id: string
          status?: "pending" | "active" | "declined"
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          teacher_id?: string
          status?: "pending" | "active" | "declined"
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          content: string
          related_id: string | null
          is_read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          content: string
          related_id?: string | null
          is_read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          content?: string
          related_id?: string | null
          is_read?: boolean | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}