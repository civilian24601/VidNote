_Last updated: 2025-04-01 14:45 EST — v1.0_

# Backend Structure

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  profile_image_url TEXT,
  instruments TEXT[],
  experience_level VARCHAR(20),
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  verified BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Videos Table
```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  piece_name VARCHAR(255),
  composer VARCHAR(255),
  practice_goals TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  video_status VARCHAR(20) DEFAULT 'processing' CHECK (video_status IN ('processing', 'ready', 'error')),
  view_count INTEGER DEFAULT 0
);

CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created_at ON videos(created_at);
```

### Comments Table
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp INTEGER NOT NULL, -- Timestamp in seconds
  category VARCHAR(50),
  parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_timestamp ON comments(timestamp);
```

### Video_Sharing Table
```sql
CREATE TABLE video_sharing (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, user_id)
);

CREATE INDEX idx_video_sharing_video_id ON video_sharing(video_id);
CREATE INDEX idx_video_sharing_user_id ON video_sharing(user_id);
```

### Student_Teacher_Relationships Table
```sql
CREATE TABLE student_teacher_relationships (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(student_id, teacher_id)
);

CREATE INDEX idx_str_student_id ON student_teacher_relationships(student_id);
CREATE INDEX idx_str_teacher_id ON student_teacher_relationships(teacher_id);
```

### Progress_Records Table (Future Implementation)
```sql
CREATE TABLE progress_records (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  technique_score INTEGER CHECK (technique_score BETWEEN 1 AND 100),
  musicality_score INTEGER CHECK (musicality_score BETWEEN 1 AND 100),
  rhythm_score INTEGER CHECK (rhythm_score BETWEEN 1 AND 100),
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_progress_student_id ON progress_records(student_id);
CREATE INDEX idx_progress_teacher_id ON progress_records(teacher_id);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  related_id INTEGER, -- Can be video_id, comment_id, etc.
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
```

## Relationships

1. **Users to Videos**: One-to-Many
   - A user can upload multiple videos
   - Each video belongs to exactly one user

2. **Users to Comments**: One-to-Many
   - A user can create multiple comments
   - Each comment is created by exactly one user

3. **Videos to Comments**: One-to-Many
   - A video can have multiple comments
   - Each comment belongs to exactly one video

4. **Comments to Comments**: One-to-Many (Self-referential)
   - A comment can have multiple replies
   - Each reply has one parent comment

5. **Users to Users** (through Student_Teacher_Relationships): Many-to-Many
   - A student can have multiple teachers
   - A teacher can have multiple students

6. **Videos to Users** (through Video_Sharing): Many-to-Many
   - A video can be shared with multiple users
   - A user can have multiple videos shared with them

## Authentication System

### Authentication Flow
1. **Registration**:
   - Collect user information
   - Validate email format and password strength
   - Hash password with bcrypt (10+ rounds)
   - Store user record
   - Generate verification token
   - Send verification email

2. **Email Verification**:
   - User clicks link with verification token
   - Validate token
   - Update user status to verified
   - Redirect to login

3. **Login**:
   - Accept email/username and password
   - Verify credentials
   - Check account status
   - Generate JWT token with:
     - User ID
     - Role
     - Expiration (24 hours)
   - Return token and basic user info
   - Update last_login timestamp

4. **Authentication Middleware**:
   - Extract JWT from Authorization header
   - Verify token signature
   - Check token expiration
   - Add user context to request
   - Allow or deny access based on role

5. **Password Reset**:
   - User requests password reset
   - Generate time-limited reset token
   - Send email with reset link
   - User submits new password with token
   - Verify token and update password

### Authorization Structure
- **Role-Based Access Control (RBAC)**:
  - Student role permissions
  - Teacher role permissions
  - Admin role permissions (future)
  
- **Resource-Based Access Control**:
  - Video owner has full access
  - Users with shared access have limited permissions
  - Public videos accessible to all authenticated users

## File Storage System

### Video Storage Architecture
1. **Upload Process**:
   - Client uploads to server
   - Server validates file (type, size, etc.)
   - File stored temporarily in server
   - Background job processes video:
     - Generate thumbnail
     - Create different quality versions
     - Calculate duration
   - Upload to cloud storage
   - Update database with URLs

2. **Storage Structure**:
   - Cloud storage bucket organized by:
     - `/videos/{user_id}/{video_id}/original.mp4`
     - `/videos/{user_id}/{video_id}/thumbnail.jpg`
     - `/videos/{user_id}/{video_id}/hd.mp4`
     - `/videos/{user_id}/{video_id}/sd.mp4`

3. **Delivery Method**:
   - Signed URLs for private videos
   - CDN distribution for optimized delivery
   - Adaptive bitrate streaming for bandwidth management

### Profile Image Storage
1. **Upload Process**:
   - Client uploads image
   - Server validates image
   - Resize and crop to standard dimensions
   - Upload to cloud storage
   - Update user profile with URL

2. **Storage Structure**:
   - `/profile-images/{user_id}/profile.jpg`
   - `/profile-images/{user_id}/thumbnail.jpg`

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/login` - Login and receive token
- `POST /api/auth/logout` - Logout (client-side token removal)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user details

### User Endpoints
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/{id}` - Get public user information
- `GET /api/users/teachers` - List available teachers
- `GET /api/users/students` - Get teacher's students

### Video Endpoints
- `POST /api/videos` - Upload new video
- `GET /api/videos` - List user's videos
- `GET /api/videos/shared` - List videos shared with user
- `GET /api/videos/{id}` - Get video details
- `PUT /api/videos/{id}` - Update video information
- `DELETE /api/videos/{id}` - Delete video
- `POST /api/videos/{id}/share` - Share video with user
- `DELETE /api/videos/{id}/share/{userId}` - Remove video share

### Comment Endpoints
- `POST /api/videos/{videoId}/comments` - Add comment
- `GET /api/videos/{videoId}/comments` - Get video comments
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment
- `POST /api/comments/{id}/replies` - Reply to comment

### Relationship Endpoints
- `POST /api/relationships/request` - Send teacher request
- `PUT /api/relationships/{id}/accept` - Accept teacher request
- `PUT /api/relationships/{id}/decline` - Decline teacher request
- `DELETE /api/relationships/{id}` - Remove relationship

### Notification Endpoints
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

## Background Jobs

### Video Processing Queue
- **Trigger**: New video upload
- **Tasks**:
  1. Extract video metadata
  2. Generate thumbnail at first frame
  3. Create different resolution versions
  4. Update video status to 'ready'
  5. Create notifications for shared users
  6. Generate optimized streaming formats

### Notification System
- **Triggers**: Various user actions
- **Tasks**:
  1. Create in-app notification
  2. Send email notification (if enabled)
  3. Send push notification (future)

### Analytics Processing (Future)
- **Trigger**: Scheduled job (daily)
- **Tasks**:
  1. Aggregate user activity data
  2. Calculate student progress metrics
  3. Generate teacher effectiveness metrics
  4. Update recommendation algorithms

## Caching Strategy
- Redis for session management
- Video metadata caching
- User profile caching
- Comment list caching with TTL
- Invalidation triggers on updates

## Monitoring and Logging
- Request logging for API endpoints
- Error logging with context
- Performance metrics for video processing
- User activity audit logs
- Authentication attempt logging