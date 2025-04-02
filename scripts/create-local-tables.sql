-- SQL Migration Script to Create Tables in Local PostgreSQL Database
-- Modified from create-supabase-tables.sql to work with local PostgreSQL

-- Users Table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "username" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'student',
  "avatar_url" TEXT,
  "instruments" JSONB,
  "experience_level" TEXT,
  "bio" TEXT,
  "verified" BOOLEAN DEFAULT FALSE,
  "active" BOOLEAN DEFAULT TRUE,
  "last_login" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos Table
CREATE TABLE IF NOT EXISTS "videos" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "piece_name" TEXT,
  "composer" TEXT,
  "practice_goals" TEXT,
  "is_public" BOOLEAN DEFAULT FALSE,
  "duration" INTEGER,
  "video_status" TEXT DEFAULT 'processing',
  "view_count" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments Table
CREATE TABLE IF NOT EXISTS "comments" (
  "id" SERIAL PRIMARY KEY,
  "video_id" INTEGER NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "content" TEXT NOT NULL,
  "timestamp" INTEGER NOT NULL, -- in seconds
  "category" TEXT,
  "parent_comment_id" INTEGER REFERENCES "comments"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Sharing Table
CREATE TABLE IF NOT EXISTS "video_sharing" (
  "id" SERIAL PRIMARY KEY,
  "video_id" INTEGER NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("video_id", "user_id")
);

-- Student-Teacher Relationships Table
CREATE TABLE IF NOT EXISTS "student_teacher_relationships" (
  "id" SERIAL PRIMARY KEY,
  "student_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "teacher_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" TEXT DEFAULT 'pending',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("student_id", "teacher_id")
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "related_id" INTEGER,
  "is_read" BOOLEAN DEFAULT FALSE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Invitations Table
CREATE TABLE IF NOT EXISTS "guest_invitations" (
  "id" SERIAL PRIMARY KEY,
  "invite_token" UUID NOT NULL UNIQUE,
  "video_id" INTEGER NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "student_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" TEXT NOT NULL,
  "guest_name" TEXT NOT NULL,
  "message" TEXT,
  "role" TEXT DEFAULT 'adjudicator',
  "status" TEXT DEFAULT 'pending',
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "used_at" TIMESTAMP WITH TIME ZONE
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON "videos"("user_id");
CREATE INDEX IF NOT EXISTS idx_comments_video_id ON "comments"("video_id");
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON "comments"("parent_comment_id");
CREATE INDEX IF NOT EXISTS idx_video_sharing_user_id ON "video_sharing"("user_id");
CREATE INDEX IF NOT EXISTS idx_video_sharing_video_id ON "video_sharing"("video_id");
CREATE INDEX IF NOT EXISTS idx_relationships_student_id ON "student_teacher_relationships"("student_id");
CREATE INDEX IF NOT EXISTS idx_relationships_teacher_id ON "student_teacher_relationships"("teacher_id");
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS idx_invitations_video_id ON "guest_invitations"("video_id");
CREATE INDEX IF NOT EXISTS idx_invitations_student_id ON "guest_invitations"("student_id");
CREATE INDEX IF NOT EXISTS idx_invitations_token ON "guest_invitations"("invite_token");

-- Create a function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON "videos"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON "comments"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationships_updated_at
BEFORE UPDATE ON "student_teacher_relationships"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();