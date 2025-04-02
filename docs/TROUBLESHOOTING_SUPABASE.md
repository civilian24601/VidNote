# Supabase Integration Troubleshooting Guide

This document provides detailed guidance for diagnosing and resolving common issues with Supabase integration in the MuseCollab platform, particularly focusing on video storage and playback problems.

## Common Supabase Storage Issues

### 1. Video Upload Failures

#### Symptoms
- Upload appears to succeed but video isn't found later
- Server returns 500 error during upload
- Upload gets stuck at "Processing"

#### Possible Causes and Solutions

**Bucket Doesn't Exist**
- **Diagnosis**: Check if the 'videos' bucket exists in your Supabase storage
- **Solution**: Create the bucket in the Supabase dashboard or run:
  ```bash
  node scripts/fix-supabase.js
  ```

**Authentication Issues**
- **Diagnosis**: Look for JWT or authentication errors in server logs
- **Solution**: Verify your Supabase API keys in the environment variables
  ```bash
  node scripts/check-env.js
  ```

**Permission Issues**
- **Diagnosis**: Look for "Permission denied" errors
- **Solution**: Check RLS policies in your Supabase dashboard:
  ```sql
  -- Public read access to videos
  CREATE POLICY "Public Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'videos');

  -- Authenticated users can upload files
  CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT 
  TO authenticated
  USING (bucket_id = 'videos');
  ```

**Service Role Key Missing**
- **Diagnosis**: Check if admin operations fail but regular operations work
- **Solution**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in your environment

### 2. Video Playback Issues

#### Symptoms
- Video appears in the list but won't play
- Player shows "Video cannot be loaded"
- Network requests to the video URL fail

#### Possible Causes and Solutions

**CORS Configuration**
- **Diagnosis**: Check browser console for CORS errors
- **Solution**: In Supabase dashboard > Storage > CORS, add:
  ```json
  {
    "origin": "*",
    "methods": ["GET", "HEAD"],
    "headers": ["Range", "Content-Type"]
  }
  ```

**URL Format Issues**
- **Diagnosis**: Run the URL diagnostic tool
  ```bash
  node scripts/diagnose-supabase-url.js
  ```
- **Solution**: Check if URLs follow the pattern:
  ```
  https://<project-id>.supabase.co/storage/v1/object/public/videos/<path>
  ```

**Bucket Privacy Settings**
- **Diagnosis**: Check if bucket is set to private
- **Solution**: Set the bucket to public in Supabase dashboard

**RLS Policy Conflicts**
- **Diagnosis**: Check if RLS policies are conflicting
- **Solution**: Simplify RLS policies to ensure they're not blocking access

## Advanced Diagnostics

### Server-Side Testing

The `diagnose-supabase-url.js` script provides comprehensive checking of your Supabase storage configuration:

```bash
node scripts/diagnose-supabase-url.js
```

Look for:
- Environment variable configuration
- URL format validation
- Direct server accessibility
- Bucket list retrieval
- URL generation testing
- CORS headers validation

### Client-Side Testing

The `test-video-playback.js` script creates a standalone HTML page for testing video playback:

```bash
node scripts/test-video-playback.js <optional-video-url>
```

This helps isolate if issues are specific to:
- The URL format itself
- Browser compatibility
- CORS configuration
- Media codecs

### Logs Analysis

Our enhanced logging system provides detailed information at each step:

**Server Upload Logs**
- Check for Supabase client status
- Upload operation details
- URL generation process
- Error responses

**Player Initialization Logs**
- URL validation
- HEAD request responses
- Media element states
- Error codes and explanations

## Architectural Considerations

### URL Generation and Storage

Our system uses a dual-storage approach:
1. Video files are stored in Supabase Storage
2. Video metadata is stored in the application's memory storage

When troubleshooting, be aware that:
- The URL stored in the database must match exactly what Supabase generates
- Path components matter (includes `/public/` for public files)
- Video IDs in the application don't match the storage path directly

### Browser Security Constraints

Modern browsers impose strict security for video playback:
- Resources must be served with proper MIME types
- CORS must be configured correctly
- HTTP URLs won't play in HTTPS pages
- Mixed content warnings can prevent playback

## When All Else Fails

If you've tried all the above diagnostics and fixes without success:

1. Try direct bucket management in the Supabase dashboard
2. Check if you can access the video URL directly in a browser
3. Try re-uploading a video with a different format
4. Verify network connectivity between your application and Supabase
5. Test with a completely new Supabase project to rule out project-specific issues