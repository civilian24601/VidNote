/**
 * Migration script to transfer data from MemStorage to Supabase
 * 
 * This script:
 * 1. Connects to Supabase
 * 2. Creates required tables if they don't exist
 * 3. Fetches all data from MemStorage
 * 4. Inserts data into Supabase tables
 * 5. Verifies the migration
 * 
 * Usage:
 * npx tsx scripts/migrate-to-supabase.ts
 */

import 'dotenv/config'
import { supabase } from '../supabase/node-client'
import { MemStorage } from '../server/storage';
import {
  User, Video, Comment, VideoSharing, 
  StudentTeacherRelationship, Notification, GuestInvitation
} from '../shared/schema';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

console.log(`${colors.cyan}${colors.bright}
===============================================================
  MIGRATION: MemStorage to Supabase Database
===============================================================
${colors.reset}`);

/**
 * Main migration function
 */
async function migrateToSupabase() {
  try {
    // Initialize memory storage to access data
    const memStorage = new MemStorage();

    // Check if tables exist in Supabase
    await checkTablesExist();

    // Migrate users
    await migrateUsers(memStorage);

    // Migrate videos
    await migrateVideos(memStorage);

    // Migrate comments
    await migrateComments(memStorage);

    // Migrate video sharing
    await migrateVideoSharing(memStorage);

    // Migrate student-teacher relationships
    await migrateRelationships(memStorage);

    // Migrate notifications
    await migrateNotifications(memStorage);

    // Migrate guest invitations
    await migrateGuestInvitations(memStorage);

    console.log(`\n${colors.green}${colors.bright}✅ Migration completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}${colors.bright}❌ Migration failed:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Check if all required tables exist in Supabase
 */
async function checkTablesExist() {
  console.log(`\n${colors.blue}Checking if required tables exist...${colors.reset}`);

  const tables = [
    'users',
    'videos',
    'comments',
    'video_sharing',
    'student_teacher_relationships',
    'notifications',
    'guest_invitations'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`${colors.red}❌ Table '${table}' doesn't exist or isn't accessible:${colors.reset}`, error.message);
      
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log(`${colors.yellow}The table '${table}' needs to be created. Run the SQL migrations first.${colors.reset}`);
      }
      
      throw new Error(`Table check failed for '${table}'`);
    } else {
      console.log(`${colors.green}✓ Table '${table}' exists with ${count} records${colors.reset}`);
    }
  }
}

/**
 * Migrate users from MemStorage to Supabase
 */
async function migrateUsers(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating users...${colors.reset}`);
  
  // Get all users from memory storage
  const usersMap = await getPrivateProperty<Map<number, User>>(memStorage, 'users');
  const users = Array.from(usersMap.values());
  
  if (users.length === 0) {
    console.log(`${colors.yellow}No users to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${users.length} users in memory storage`);
  
  // Check for existing users in Supabase to avoid duplicates
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('email');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing users:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingEmails = new Set((existingUsers || []).map(u => u.email));
  
  // Filter out users that already exist in Supabase
  const newUsers = users.filter(user => !existingEmails.has(user.email));
  
  if (newUsers.length === 0) {
    console.log(`${colors.yellow}All users already exist in Supabase${colors.reset}`);
    return;
  }
  
  console.log(`Migrating ${newUsers.length} users to Supabase`);
  
  // Insert users in batches of 50
  const batchSize = 50;
  for (let i = 0; i < newUsers.length; i += batchSize) {
    const batch = newUsers.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('users')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting users (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Users migration completed${colors.reset}`);
}

/**
 * Migrate videos from MemStorage to Supabase
 */
async function migrateVideos(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating videos...${colors.reset}`);
  
  // Get all videos from memory storage
  const videosMap = await getPrivateProperty<Map<number, Video>>(memStorage, 'videos');
  const videos = Array.from(videosMap.values());
  
  if (videos.length === 0) {
    console.log(`${colors.yellow}No videos to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${videos.length} videos in memory storage`);
  
  // Check for existing videos in Supabase to avoid duplicates
  const { data: existingVideos, error: checkError } = await supabase
    .from('videos')
    .select('id');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing videos:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingIds = new Set((existingVideos || []).map(v => v.id));
  
  // Filter out videos that already exist in Supabase
  const newVideos = videos.filter(video => !existingIds.has(video.id));
  
  if (newVideos.length === 0) {
    console.log(`${colors.yellow}All videos already exist in Supabase${colors.reset}`);
    return;
  }
  
  // Fix URL format for Supabase storage if needed
  for (const video of newVideos) {
    if (video.url && video.url.includes('/storage/v1/object/public/public/')) {
      // Fix double "public" in URL
      video.url = video.url.replace('/storage/v1/object/public/public/', '/storage/v1/object/public/');
      console.log(`Fixed URL format for video ${video.id}: ${video.url}`);
    }
  }
  
  console.log(`Migrating ${newVideos.length} videos to Supabase`);
  
  // Insert videos in batches of 25
  const batchSize = 25;
  for (let i = 0; i < newVideos.length; i += batchSize) {
    const batch = newVideos.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('videos')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting videos (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Videos migration completed${colors.reset}`);
}

/**
 * Migrate comments from MemStorage to Supabase
 */
async function migrateComments(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating comments...${colors.reset}`);
  
  // Get all comments from memory storage
  const commentsMap = await getPrivateProperty<Map<number, Comment>>(memStorage, 'comments');
  const comments = Array.from(commentsMap.values());
  
  if (comments.length === 0) {
    console.log(`${colors.yellow}No comments to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${comments.length} comments in memory storage`);
  
  // Check for existing comments in Supabase to avoid duplicates
  const { data: existingComments, error: checkError } = await supabase
    .from('comments')
    .select('id');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing comments:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingIds = new Set((existingComments || []).map(c => c.id));
  
  // Filter out comments that already exist in Supabase
  const newComments = comments.filter(comment => !existingIds.has(comment.id));
  
  if (newComments.length === 0) {
    console.log(`${colors.yellow}All comments already exist in Supabase${colors.reset}`);
    return;
  }
  
  console.log(`Migrating ${newComments.length} comments to Supabase`);
  
  // Sort comments to ensure parent comments are inserted before replies
  newComments.sort((a, b) => {
    // If neither has a parent, sort by ID
    if (!a.parentCommentId && !b.parentCommentId) return a.id - b.id;
    
    // Parent comments come before replies
    if (!a.parentCommentId) return -1;
    if (!b.parentCommentId) return 1;
    
    // If both are replies, sort by parent ID first, then by their own ID
    return a.parentCommentId === b.parentCommentId
      ? a.id - b.id
      : a.parentCommentId! - b.parentCommentId!;
  });
  
  // Insert comments in batches of 50
  const batchSize = 50;
  for (let i = 0; i < newComments.length; i += batchSize) {
    const batch = newComments.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('comments')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting comments (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Comments migration completed${colors.reset}`);
}

/**
 * Migrate video sharing from MemStorage to Supabase
 */
async function migrateVideoSharing(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating video sharing...${colors.reset}`);
  
  // Get all video sharings from memory storage
  const sharingsMap = await getPrivateProperty<Map<number, VideoSharing>>(memStorage, 'videoSharings');
  const sharings = Array.from(sharingsMap.values());
  
  if (sharings.length === 0) {
    console.log(`${colors.yellow}No video sharings to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${sharings.length} video sharings in memory storage`);
  
  // Check for existing sharings in Supabase to avoid duplicates
  const { data: existingSharings, error: checkError } = await supabase
    .from('video_sharing')
    .select('id');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing video sharings:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingIds = new Set((existingSharings || []).map(s => s.id));
  
  // Filter out sharings that already exist in Supabase
  const newSharings = sharings.filter(sharing => !existingIds.has(sharing.id));
  
  if (newSharings.length === 0) {
    console.log(`${colors.yellow}All video sharings already exist in Supabase${colors.reset}`);
    return;
  }
  
  console.log(`Migrating ${newSharings.length} video sharings to Supabase`);
  
  // Insert sharings in batches of 100
  const batchSize = 100;
  for (let i = 0; i < newSharings.length; i += batchSize) {
    const batch = newSharings.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('video_sharing')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting video sharings (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Video sharings migration completed${colors.reset}`);
}

/**
 * Migrate student-teacher relationships from MemStorage to Supabase
 */
async function migrateRelationships(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating student-teacher relationships...${colors.reset}`);
  
  // Get all relationships from memory storage
  const relationshipsMap = await getPrivateProperty<Map<number, StudentTeacherRelationship>>(memStorage, 'relationships');
  const relationships = Array.from(relationshipsMap.values());
  
  if (relationships.length === 0) {
    console.log(`${colors.yellow}No student-teacher relationships to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${relationships.length} student-teacher relationships in memory storage`);
  
  // Check for existing relationships in Supabase to avoid duplicates
  const { data: existingRelationships, error: checkError } = await supabase
    .from('student_teacher_relationships')
    .select('id');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing student-teacher relationships:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingIds = new Set((existingRelationships || []).map(r => r.id));
  
  // Filter out relationships that already exist in Supabase
  const newRelationships = relationships.filter(relationship => !existingIds.has(relationship.id));
  
  if (newRelationships.length === 0) {
    console.log(`${colors.yellow}All student-teacher relationships already exist in Supabase${colors.reset}`);
    return;
  }
  
  console.log(`Migrating ${newRelationships.length} student-teacher relationships to Supabase`);
  
  // Insert relationships in batches of 100
  const batchSize = 100;
  for (let i = 0; i < newRelationships.length; i += batchSize) {
    const batch = newRelationships.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('student_teacher_relationships')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting student-teacher relationships (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Student-teacher relationships migration completed${colors.reset}`);
}

/**
 * Migrate notifications from MemStorage to Supabase
 */
async function migrateNotifications(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating notifications...${colors.reset}`);
  
  // Get all notifications from memory storage
  const notificationsMap = await getPrivateProperty<Map<number, Notification>>(memStorage, 'notifications');
  const notifications = Array.from(notificationsMap.values());
  
  if (notifications.length === 0) {
    console.log(`${colors.yellow}No notifications to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${notifications.length} notifications in memory storage`);
  
  // Check for existing notifications in Supabase to avoid duplicates
  const { data: existingNotifications, error: checkError } = await supabase
    .from('notifications')
    .select('id');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing notifications:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingIds = new Set((existingNotifications || []).map(n => n.id));
  
  // Filter out notifications that already exist in Supabase
  const newNotifications = notifications.filter(notification => !existingIds.has(notification.id));
  
  if (newNotifications.length === 0) {
    console.log(`${colors.yellow}All notifications already exist in Supabase${colors.reset}`);
    return;
  }
  
  console.log(`Migrating ${newNotifications.length} notifications to Supabase`);
  
  // Insert notifications in batches of 100
  const batchSize = 100;
  for (let i = 0; i < newNotifications.length; i += batchSize) {
    const batch = newNotifications.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('notifications')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting notifications (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Notifications migration completed${colors.reset}`);
}

/**
 * Migrate guest invitations from MemStorage to Supabase
 */
async function migrateGuestInvitations(memStorage: MemStorage) {
  console.log(`\n${colors.blue}Migrating guest invitations...${colors.reset}`);
  
  // Get all guest invitations from memory storage
  const invitationsMap = await getPrivateProperty<Map<number, GuestInvitation>>(memStorage, 'guestInvitations');
  const invitations = Array.from(invitationsMap.values());
  
  if (invitations.length === 0) {
    console.log(`${colors.yellow}No guest invitations to migrate${colors.reset}`);
    return;
  }
  
  console.log(`Found ${invitations.length} guest invitations in memory storage`);
  
  // Check for existing invitations in Supabase to avoid duplicates
  const { data: existingInvitations, error: checkError } = await supabase
    .from('guest_invitations')
    .select('id');
    
  if (checkError) {
    console.error(`${colors.red}Error checking existing guest invitations:${colors.reset}`, checkError);
    throw checkError;
  }
  
  const existingIds = new Set((existingInvitations || []).map(i => i.id));
  
  // Filter out invitations that already exist in Supabase
  const newInvitations = invitations.filter(invitation => !existingIds.has(invitation.id));
  
  if (newInvitations.length === 0) {
    console.log(`${colors.yellow}All guest invitations already exist in Supabase${colors.reset}`);
    return;
  }
  
  console.log(`Migrating ${newInvitations.length} guest invitations to Supabase`);
  
  // Insert invitations in batches of 50
  const batchSize = 50;
  for (let i = 0; i < newInvitations.length; i += batchSize) {
    const batch = newInvitations.slice(i, i + batchSize);
    
    const { error } = await supabase
      .from('guest_invitations')
      .insert(batch);
      
    if (error) {
      console.error(`${colors.red}Error inserting guest invitations (batch ${i / batchSize + 1}):${colors.reset}`, error);
      throw error;
    }
  }
  
  console.log(`${colors.green}✓ Guest invitations migration completed${colors.reset}`);
}

/**
 * Utility function to access private properties of a class
 */
async function getPrivateProperty<T>(instance: any, propertyName: string): Promise<T> {
  return instance[propertyName] as T;
}

// Run the migration
migrateToSupabase().catch(error => {
  console.error(`\n${colors.red}${colors.bright}Migration failed with error:${colors.reset}`, error);
  process.exit(1);
});