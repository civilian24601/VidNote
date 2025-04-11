import { pgTable, text, timestamp, boolean, json, uuid, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User model
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").notNull().default("student"),
  instruments: json("instruments").$type<string[]>(),
  experienceLevel: text("experience_level"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

// Video model
export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  pieceName: text("piece_name"),
  composer: text("composer"),
  practiceGoals: text("practice_goals"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: text("duration"),
  isPublic: boolean("is_public").default(false),
  videoStatus: text("video_status").default("processing"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true
});

// Comments model
export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videos.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: numeric("timestamp").notNull(),
  category: text("category"),
  parentCommentId: uuid("parent_comment_id"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true
});

// Video sharing model
export const videoShares = pgTable("video_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").notNull().references(() => videos.id),
  sharedWith: uuid("shared_with").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertVideoShareSchema = createInsertSchema(videoShares).omit({
  id: true,
  createdAt: true
});

// Relationships model
export const relationships = pgTable("relationships", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => users.id),
  teacherId: uuid("teacher_id").notNull().references(() => users.id),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertRelationshipSchema = createInsertSchema(relationships).omit({
  id: true,
  createdAt: true
});

// Notifications model
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  relatedId: uuid("related_id"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true
});

// Base Types (inferred from database schema)
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type VideoShare = typeof videoShares.$inferSelect;
export type InsertVideoShare = z.infer<typeof insertVideoShareSchema>;

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Schema Version Control
export const SCHEMA_VERSION = '1.0.0';

// Schema Validation Rules
export const validateSchema = (data: unknown, schema: z.ZodType<any>) => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Schema validation failed:', error.errors);
    }
    throw error;
  }
};

// Table Relations
export const userRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  comments: many(comments),
  notifications: many(notifications),
  sharedVideos: many(videoShares, { relationName: "sharedWith" })
}));

export const videoRelations = relations(videos, ({ one, many }) => ({
  owner: one(users, {
    fields: [videos.userId],
    references: [users.id]
  }),
  comments: many(comments),
  shares: many(videoShares)
}));

export const commentRelations = relations(comments, ({ one, many }) => ({
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id]
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id]
  }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id]
  }),
  replies: many(comments, {
    relationName: "parent"
  })
}));

export const videoShareRelations = relations(videoShares, ({ one }) => ({
  video: one(videos, {
    fields: [videoShares.videoId],
    references: [videos.id]
  }),
  sharedWithUser: one(users, {
    fields: [videoShares.sharedWith],
    references: [users.id]
  })
}));

export const relationshipRelations = relations(relationships, ({ one }) => ({
  student: one(users, {
    fields: [relationships.studentId],
    references: [users.id]
  }),
  teacher: one(users, {
    fields: [relationships.teacherId],
    references: [users.id]
  })
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));
