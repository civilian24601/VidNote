-- SQL Migration Script to Create Tables in Supabase
-- Copy and run this in the Supabase SQL Editor

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

-- Add Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "videos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "video_sharing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_teacher_relationships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "guest_invitations" ENABLE ROW LEVEL SECURITY;

-- Policy for users
-- Users can view other users' profiles but can only edit their own
CREATE POLICY "Allow users to view all users"
ON "users" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users to update their own profile"
ON "users" FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text OR role = 'admin');

-- Policy for videos
-- Users can view videos they own or are shared with them
CREATE POLICY "Allow users to view own videos"
ON "videos" FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()::integer
  OR EXISTS (
    SELECT 1 FROM "video_sharing"
    WHERE video_id = id AND user_id = auth.uid()::integer
  )
  OR is_public = true
);

CREATE POLICY "Allow users to create their own videos"
ON "videos" FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::integer);

CREATE POLICY "Allow users to update their own videos"
ON "videos" FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::integer);

CREATE POLICY "Allow users to delete their own videos"
ON "videos" FOR DELETE
TO authenticated
USING (user_id = auth.uid()::integer);

-- Policy for comments
-- Users can view comments on videos they have access to
CREATE POLICY "Allow users to view comments on accessible videos"
ON "comments" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id
    AND (
      user_id = auth.uid()::integer
      OR EXISTS (
        SELECT 1 FROM "video_sharing"
        WHERE video_id = videos.id AND user_id = auth.uid()::integer
      )
      OR is_public = true
    )
  )
);

CREATE POLICY "Allow users to create comments on accessible videos"
ON "comments" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id
    AND (
      user_id = auth.uid()::integer
      OR EXISTS (
        SELECT 1 FROM "video_sharing"
        WHERE video_id = videos.id AND user_id = auth.uid()::integer
      )
    )
  )
);

CREATE POLICY "Allow users to update their own comments"
ON "comments" FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::integer);

CREATE POLICY "Allow users to delete their own comments"
ON "comments" FOR DELETE
TO authenticated
USING (user_id = auth.uid()::integer);

-- Policy for video_sharing
-- Users can view sharing for videos they own
CREATE POLICY "Allow users to view sharing for own videos"
ON "video_sharing" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
  OR user_id = auth.uid()::integer
);

CREATE POLICY "Allow users to share own videos"
ON "video_sharing" FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
);

CREATE POLICY "Allow users to delete sharing of own videos"
ON "video_sharing" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
);

-- Policy for student_teacher_relationships
-- Users can view relationships they are part of
CREATE POLICY "Allow users to view own relationships"
ON "student_teacher_relationships" FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()::integer
  OR teacher_id = auth.uid()::integer
);

CREATE POLICY "Allow students and teachers to create relationships"
ON "student_teacher_relationships" FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()::integer
  OR teacher_id = auth.uid()::integer
);

CREATE POLICY "Allow users to update own relationships"
ON "student_teacher_relationships" FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()::integer
  OR teacher_id = auth.uid()::integer
);

CREATE POLICY "Allow users to delete own relationships"
ON "student_teacher_relationships" FOR DELETE
TO authenticated
USING (
  student_id = auth.uid()::integer
  OR teacher_id = auth.uid()::integer
);

-- Policy for notifications
-- Users can only view and update their own notifications
CREATE POLICY "Allow users to view own notifications"
ON "notifications" FOR SELECT
TO authenticated
USING (user_id = auth.uid()::integer);

CREATE POLICY "Allow system to create notifications for any user"
ON "notifications" FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow users to update own notifications"
ON "notifications" FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::integer);

-- Policy for guest_invitations
-- Owners can view and manage invitations for their videos
CREATE POLICY "Allow users to view invitations for own videos"
ON "guest_invitations" FOR SELECT
TO authenticated
USING (
  student_id = auth.uid()::integer
  OR EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
);

CREATE POLICY "Allow students to create invitations for own videos"
ON "guest_invitations" FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()::integer
  AND EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
);

CREATE POLICY "Allow users to update own invitations"
ON "guest_invitations" FOR UPDATE
TO authenticated
USING (
  student_id = auth.uid()::integer
  OR EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
);

CREATE POLICY "Allow users to delete own invitations"
ON "guest_invitations" FOR DELETE
TO authenticated
USING (
  student_id = auth.uid()::integer
  OR EXISTS (
    SELECT 1 FROM "videos"
    WHERE id = video_id AND user_id = auth.uid()::integer
  )
);