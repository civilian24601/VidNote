# MuseCollab - Collaborative Music Education Platform

MuseCollab is a cutting-edge web platform revolutionizing music education through innovative video performance review and multi-teacher feedback mechanisms.

![MuseCollab Platform](https://i.imgur.com/placeholder.png)

## Vision

MuseCollab bridges the gap between traditional music instruction and digital learning by providing a collaborative space where:

- Students can upload performance videos and receive timestamped feedback
- Multiple teachers can collaborate on student performances
- Real-time interaction enhances the educational experience
- Practice analytics help track student progress

## Key Features

### For Students
- **Video Upload and Management**: Upload practice sessions and performances
- **Multi-Teacher Feedback**: Receive guidance from multiple instructors on a single video
- **Timestamped Comments**: Precisely pinpoint feedback to specific moments in performances
- **Practice Goals Tracking**: Set and monitor progress on specific musical objectives
- **Performance Analytics**: Visualize practice trends and improvement over time

### For Teachers
- **Collaborative Feedback**: Coordinate with other teachers on student performances
- **Real-time Commenting**: Provide feedback with live typing indicators
- **Student Management**: Organize students and track their progress
- **Video Sharing Controls**: Share videos with specific teachers for collaborative feedback
- **Analytics Dashboard**: Monitor student engagement and progress

## Technology Stack

- **Frontend**: React with TypeScript and Tailwind CSS
- **Backend**: Express.js server
- **Database**: PostgreSQL (via Supabase)
- **Real-time Communication**: WebSockets for live collaboration
- **Video Handling**: HTML5 video with custom timeline markers
- **Authentication**: JWT-based auth through Supabase

## Implementation Status

The project is currently under active development with the following components completed:

- ✅ User authentication system
- ✅ Video uploading and playback functionality
- ✅ Timestamped commenting system
- ✅ Real-time collaboration using WebSockets
- ✅ Typing indicators for collaborative feedback
- ✅ Video sharing between teachers
- ✅ Basic user interface for students and teachers
- 🔄 Enhanced analytics dashboard (in progress)
- 🔄 Practice goal setting and tracking (in progress)
- 🔄 Multiple teacher feedback visualization (in progress)

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/musecollab.git
cd musecollab
```

2. Install dependencies
```bash
npm install
```

3. Set up your Supabase project:
   - Create a project at [supabase.com](https://supabase.com)
   - Create two storage buckets: `videos` and `thumbnails`
   - Set up RLS (Row Level Security) policies for these buckets:
     ```sql
     -- Public read access to videos and thumbnails
     CREATE POLICY "Public Access" 
     ON storage.objects FOR SELECT 
     USING (bucket_id IN ('videos', 'thumbnails'));

     -- Authenticated users can upload files
     CREATE POLICY "Authenticated users can upload files"
     ON storage.objects FOR INSERT 
     TO authenticated
     USING (bucket_id IN ('videos', 'thumbnails'));

     -- Users can update their own files
     CREATE POLICY "Users can update own files"
     ON storage.objects FOR UPDATE
     TO authenticated
     USING (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text)
     WITH CHECK (bucket_id IN ('videos', 'thumbnails') 
               AND (storage.foldername(name))[1] = auth.uid()::text);

     -- Users can delete their own files
     CREATE POLICY "Users can delete own files"
     ON storage.objects FOR DELETE
     TO authenticated
     USING (bucket_id IN ('videos', 'thumbnails') 
           AND (storage.foldername(name))[1] = auth.uid()::text);
     ```

4. Create a `.env` file with your Supabase credentials:
```
# Server-side environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Client-side environment variables (for browser access)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

   > **Important**: Never expose your service role key in client-side code. This key has admin privileges and should only be used on the server.

5. Verify your environment setup
```bash
# Check if all required environment variables are set
node scripts/check-env.js

# If there are any issues with URL matching, run:
node scripts/fix-env.js

# Validate Supabase connection and check buckets
node scripts/validate-supabase.js
```

6. Start the development server
```bash
npm run dev
```

7. Open your browser to `http://localhost:5000`

## Troubleshooting

### Environment Variables Issues

If you encounter problems with environment variables, we've included several scripts to help:

- **check-env.js**: Verifies all required variables exist and have the correct format
- **fix-env.js**: Automatically synchronizes client and server environment variables
- **validate-supabase.js**: Tests Supabase connection and verifies storage buckets

Common issues:

1. **Client-side connection issues**: Make sure your environment variables with the `VITE_` prefix match the server-side variables. Client-side variables must have this prefix to be accessible in the browser.

2. **Storage bucket errors**: Ensure you've created both the `videos` and `thumbnails` buckets in your Supabase storage. The `validate-supabase.js` script can create these automatically or guide you through the process.

3. **Different values for server and client**: The URL and anon key should be identical for both client and server sides. Use `fix-env.js` to ensure consistency.

### Supabase Connection Issues

If you're having trouble connecting to Supabase:

1. Verify credentials in the Supabase dashboard: Project Settings > API
2. Ensure your project is active (not paused)
3. Check if your IP is allowed (if you have restrictions enabled)
4. Run the `validate-supabase.js` script for detailed diagnostics

### Video Upload Issues

If videos fail to upload:

1. Check if the storage buckets exist and have the correct RLS policies
2. Verify the file size doesn't exceed the 100MB limit
3. Ensure you're authenticated when attempting to upload
4. Look for CORS-related errors in the browser console

### Video Playback Issues

If you can upload videos but they don't play correctly:

1. Check if the video URL is accessible by running:
   ```bash
   node scripts/diagnose-supabase-url.js
   ```
   This script will diagnose Supabase URL access issues by:
   - Checking environment variables
   - Validating Supabase URL format
   - Testing direct access to the URL
   - Checking CORS headers
   - Verifying public bucket permissions

2. Test video playback in isolation:
   ```bash
   # To test a specific video URL
   node scripts/test-video-playback.js "https://your-supabase-url/storage/v1/object/public/videos/path/to/video.mp4"
   
   # Or to test with the first available video in your bucket
   node scripts/test-video-playback.js
   ```
   This will create a standalone HTML player page to test your video without the complexity of the full application.

3. Diagnose bucket permissions:
   ```bash
   node scripts/check-buckets.js
   ```
   This will verify your bucket permissions and test file access from both server and client perspectives.

4. If issues persist, use the enhanced logging built into the platform:
   - Check server logs during upload for detailed Supabase storage interaction
   - Check browser console for video player initialization and loading states
   - Look for status code errors or CORS-related failures in network requests

5. For a comprehensive troubleshooting guide, refer to [docs/TROUBLESHOOTING_SUPABASE.md](docs/TROUBLESHOOTING_SUPABASE.md) which includes:
   - Detailed error diagnosis procedures
   - Common RLS policy configurations
   - CORS setup instructions
   - Advanced diagnostic techniques
   - Browser-specific troubleshooting

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Inspired by the needs of music educators worldwide
- Built with modern web technologies to create an optimal learning experience