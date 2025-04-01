import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// Video model
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  userId: integer("user_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(false),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true
});

// Comments model
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").notNull().references(() => videos.id),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: integer("timestamp").notNull(), // in seconds
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true, 
  createdAt: true
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type VideoSharing = typeof videoSharing.$inferSelect;
export type InsertVideoSharing = z.infer<typeof insertVideoSharingSchema>;
