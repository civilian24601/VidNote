# Video Handling Documentation

## Overview
This document describes how video uploads, processing, and playback work in our music education platform. It covers the entire lifecycle of videos from upload to playback and explains how to troubleshoot common issues.

## User Session Management

### How User Sessions Work
1. When a user logs in via Supabase Auth, our system:
   - Attempts to match with an existing user record
   - Creates a new user record if none exists
   - Sets cookies to help with session persistence
   - Returns the user record to be stored in localStorage

2. Potential Issues:
   - Multiple user accounts can be created when a user logs in from different devices
   - Supabase Auth and our internal user IDs can get out of sync

3. Solutions:
   - We use email as a fallback lookup method
   - Cookie-based recovery helps maintain session continuity
   - Secondary lookups ensure user data persistence

## Video Upload Process

### How Upload Works
1. When a user uploads a video:
   - Client sends the video file to the server via multipart form data
   - Server validates the file size and type
   - Server uploads the file to Supabase Storage's "videos" bucket
   - Server creates a record in our storage system with metadata
   - Video status is set to "ready" immediately

2. Video Storage Structure:
   - Videos are stored in Supabase Storage under the "videos" bucket
   - The file path is structured as `{userId}/{timestamp}{extension}`
   - This structure aligns with Supabase RLS (Row Level Security) policies

3. Requirements for Uploading:
   - Supabase Storage must have a "videos" bucket
   - The bucket must have proper RLS policies set
   - The user must be authenticated
   - File size should be below 100MB

### Common Upload Issues
1. **Missing Buckets**
   - Error Message: "Storage bucket 'videos' not found"
   - Solution: Create the required buckets in Supabase dashboard

2. **Permission Denied**
   - Error Message: "Permission denied when uploading to Supabase"
   - Solution: Check RLS policies in Supabase dashboard

3. **File Too Large**
   - Error Message: "File size exceeds the maximum allowed limit"
   - Solution: Compress the video before uploading

## Video Playback

### How Playback Works
1. Our platform uses the Plyr.js library for video playback
2. Video loading process:
   - The watch.tsx component requests video data from the server
   - The player checks if the URL is accessible via a HEAD request
   - The Plyr player is initialized with the verified URL
   - Multiple video sources (mp4, webm, ogg) are configured for compatibility

3. Status Handling:
   - All videos are marked as "ready" after upload
   - The player has its own error detection and handling
   - If a video fails to load, detailed error information is shown

### Common Playback Issues
1. **Video Not Found**
   - Cause: Video URL is invalid or file is missing
   - Debugging: Check browser console for fetch errors
   - Solution: Re-upload the video or check Supabase Storage

2. **Video Not Playing**
   - Cause: Format not supported or CORS issues
   - Debugging: Check browser console for media errors
   - Solution: Use the "Open Directly" link to verify the file exists

3. **Video Processing Stuck**
   - Cause: Status mismatch between list view and detailed view
   - Debugging: Check videoStatus value in the browser console
   - Solution: Ensure consistent status handling in all components

## Supabase Storage Requirements

### Required Buckets
1. **videos** - Stores all uploaded video files
2. **thumbnails** - Stores video thumbnail images

### RLS Policies
```sql
-- Allow public access to read (view) videos
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT 
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails'));

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id IN ('videos', 'thumbnails') 
       AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Debugging Tips

1. **Locate Video Issues**:
   - Check browser console logs for media errors
   - Verify the video URL with a direct HEAD request
   - Inspect video element with browser developer tools

2. **Fix Missing Videos**:
   - If videos don't appear in "My Videos", check user ID consistency
   - Ensure the user is properly authenticated
   - Verify database connectivity

3. **Fix Processing Status**:
   - The watch.tsx component handles videoStatus
   - Check if videoStatus is "ready" in the server response
   - Verify log output of "Video status from server: ..."