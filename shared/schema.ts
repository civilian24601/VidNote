import { pgTable, text, serial, integer, timestamp, boolean, json, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("student"),
  avatarUrl: text("avatar_url"),
  instruments: json("instruments").$type<string[]>(),
  experienceLevel: text("experience_level"),
  bio: text("bio"),
  verified: boolean("verified").default(false),
  active: boolean("active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
  verified: true,
  active: true
});

// Video model
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  userId: integer("user_id").notNull().references(() => users.id),
  pieceName: text("piece_name"),
  composer: text("composer"),
  practiceGoals: text("practice_goals"),
  isPublic: boolean("is_public").default(false),
  duration: integer("duration"),
  videoStatus: text("video_status").default("processing"),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  // videoStatus is no longer omitted to allow setting it during insertion
  viewCount: true
});

// Comments model
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: integer("timestamp").notNull(), // in seconds
  category: text("category"),
  parentCommentId: integer("parent_comment_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true, 
  createdAt: true,
  updatedAt: true
});

// Video sharing model
export const videoSharing = pgTable("video_sharing", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertVideoSharingSchema = createInsertSchema(videoSharing).omit({
  id: true,
  createdAt: true
});

// Student-Teacher relationship model
export const studentTeacherRelationships = pgTable("student_teacher_relationships", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  teacherId: integer("teacher_id").notNull().references(() => users.id),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertStudentTeacherRelationshipSchema = createInsertSchema(studentTeacherRelationships).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Notifications model
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  relatedId: integer("related_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true
});

// Guest Invitations model for one-time adjudicator feedback
export const guestInvitations = pgTable("guest_invitations", {
  id: serial("id").primaryKey(),
  inviteToken: uuid("invite_token").notNull().unique(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  guestName: text("guest_name").notNull(),
  message: text("message"),
  role: text("role").default("adjudicator"),
  status: text("status").default("pending"), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

export const insertGuestInvitationSchema = createInsertSchema(guestInvitations).omit({
  id: true,
  inviteToken: true,
  createdAt: true,
  usedAt: true,
  status: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type VideoSharing = typeof videoSharing.$inferSelect;
export type InsertVideoSharing = z.infer<typeof insertVideoSharingSchema>;

export type StudentTeacherRelationship = typeof studentTeacherRelationships.$inferSelect;
export type InsertStudentTeacherRelationship = z.infer<typeof insertStudentTeacherRelationshipSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type GuestInvitation = typeof guestInvitations.$inferSelect;
export type InsertGuestInvitation = z.infer<typeof insertGuestInvitationSchema>;
