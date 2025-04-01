_Last updated: 2025-04-01 14:40 EST — v1.0_

# Application Flow

## Onboarding Flow

### 1. Landing Page
**Screen:** Homepage
- Header with app name and logo
- Hero section with platform description
- "Sign Up" and "Log In" buttons prominently displayed
- Feature highlights with visual aids
- Testimonials section (future)
- Footer with necessary links

**Actions:**
- Click "Sign Up" → Proceed to Registration Page
- Click "Log In" → Proceed to Login Page
- Click "Learn More" → Scroll to feature section

### 2. Registration Page
**Screen:** User Registration
- Registration form
- Role selection (Student/Teacher)
- Required fields: Full Name, Email, Password, Confirm Password
- Optional fields: Instrument(s), Experience Level
- Terms and Conditions checkbox
- "Create Account" button

**Actions:**
- Complete form → Submit registration
- Click "Already have an account?" → Redirect to Login Page
- Submit form → Email verification sent → Verification Page

### 3. Email Verification
**Screen:** Verification Pending
- Confirmation message about sent email
- Instructions to check inbox
- Resend verification link option
- Return to homepage option

**Actions:**
- Click email verification link → Email confirmed → Redirect to Profile Setup
- Click "Resend verification" → New email sent
- Click "Return to homepage" → Redirect to Landing Page

### 4. Profile Setup
**Screen:** Complete Your Profile
- Upload profile picture option
- Instrument selection (multiple allowed)
- Experience level selection
- Learning goals text field (for students)
- Teaching specialization fields (for teachers)
- "Complete Profile" button

**Actions:**
- Fill required fields → Submit profile → Dashboard redirect
- Skip for now → Basic profile created → Dashboard redirect

### 5. Login Page
**Screen:** User Login
- Email/Username field
- Password field
- "Remember me" checkbox
- "Forgot password?" link
- "Log In" button

**Actions:**
- Enter credentials → Submit → Dashboard redirect
- Click "Forgot password?" → Password reset flow
- Click "Create an account" → Registration page redirect

## Student Main Flows

### 1. Student Dashboard
**Screen:** Student Home
- Welcome message with user name
- Quick stats (videos uploaded, feedback received, practice time)
- Recent activity feed
- Quick upload button
- Navigation sidebar (My Videos, Shared with Me, Profile, Settings)
- Notification bell with counter

**Actions:**
- Click "Upload New Video" → Video Upload flow
- Click "My Videos" → Personal Video Library
- Click notification bell → Notification Center
- Click video thumbnail → Video Playback screen

### 2. Video Upload
**Screen:** Upload New Performance
- File upload zone (drag and drop or browse files)
- Progress bar during upload
- Form fields:
  - Video title (required)
  - Description (optional)
  - Piece/Song information
  - Practice goals
  - Teacher selection (share with)
- "Upload" button (disabled until required fields completed)

**Actions:**
- Select file → File validation → Upload begins
- Fill required fields → Enable upload button
- Click "Upload" → Processing confirmation
- Processing complete → Success message → Video page redirect

### 3. Personal Video Library
**Screen:** My Videos
- Grid/list toggle view of all uploaded videos
- Sorting options (newest, oldest, most commented)
- Filter options (by teacher, by feedback status)
- Each video card shows:
  - Thumbnail
  - Title
  - Upload date
  - Number of comments
  - Last activity
- Pagination or infinite scroll

**Actions:**
- Click video card → Video Playback screen
- Click sort/filter → Update video listing
- Click "Upload New" → Video Upload flow
- Click delete icon → Deletion confirmation dialog

### 4. Video Playback & Feedback
**Screen:** Video Viewer
- Video player with custom controls
- Scrubber with comment markers
- Comment timeline below video
- Comment section showing:
  - Timestamp
  - Teacher name and photo
  - Comment text
  - Category tag if applicable
- Comment reply field
- Feedback summary panel
- "Share with Teacher" button (if not already shared)

**Actions:**
- Play/pause video → Video playback control
- Click timestamp marker → Jump to specific time point
- Click "Reply" on comment → Open reply field
- Enter reply → Submit → Update comment thread
- Click "Share with Teacher" → Teacher selection dialog

### 5. Notification Center
**Screen:** Notifications
- List of all notifications, newest first
- Types of notifications:
  - New comment received
  - Teacher shared video
  - Comment replied to
  - System announcements
- Each notification shows:
  - Icon indicating type
  - Brief description
  - Time/date
  - "Mark as read" option

**Actions:**
- Click notification → Navigate to relevant page
- Click "Mark all as read" → Clear notification count
- Click "Settings" → Notification preferences

## Teacher Main Flows

### 1. Teacher Dashboard
**Screen:** Teacher Home
- Welcome message with user name
- Quick stats (students, pending reviews, completed reviews)
- Student activity feed
- Navigation sidebar (Students, Pending Reviews, Completed Reviews)
- Notification bell with counter
- Calendar view (future implementation)

**Actions:**
- Click "Pending Reviews" → Videos shared for review
- Click student name → Student profile view
- Click notification → Notification Center
- Click calendar event → Scheduled review

### 2. Student Management
**Screen:** My Students
- List of all connected students
- Each student card shows:
  - Student name and photo
  - Instrument(s)
  - Latest activity
  - Number of shared videos
  - Quick action buttons
- Search and filter options
- "Add Student" button (sends invitation)

**Actions:**
- Click student card → Student detail view
- Click "Review Videos" → Videos shared by student
- Click "Add Student" → Student invitation flow
- Click filter → Filter student list

### 3. Video Review
**Screen:** Video Feedback
- Video player with advanced controls
- Timeline with existing comment markers
- Comment creation tool:
  - Timestamp auto-filled when paused
  - Text field for feedback
  - Category dropdown (technique, theory, etc.)
  - Save button
- Overall feedback section
- Previous comments list
- "Complete Review" button

**Actions:**
- Pause video → Comment creation tool opens
- Enter feedback → Save → Comment added to timeline
- Click existing comment → Jump to timestamp
- Edit/delete own comments → Update feedback
- Click "Complete Review" → Mark as reviewed

### 4. Student Progress View
**Screen:** Student Progress
- Student info header
- Performance timeline showing all videos
- Progress metrics:
  - Practice frequency
  - Common feedback areas
  - Improvement indicators
- Feedback history
- Practice recommendation tool

**Actions:**
- Click video on timeline → Open video review
- Click feedback category → Filter by category
- Create practice recommendation → Send to student
- Export progress report → Download options

## Settings and Profile Management

### 1. User Profile
**Screen:** Profile
- Profile picture
- User information
- Bio/description
- Instrument(s) and experience
- Statistics summary
- Edit profile button

**Actions:**
- Click "Edit Profile" → Profile edit mode
- Update information → Save changes
- Change profile picture → Upload new image

### 2. Account Settings
**Screen:** Settings
- Account section:
  - Email management
  - Password change
  - Connected accounts
- Notification preferences:
  - Email notification toggles
  - In-app notification toggles
- Privacy settings:
  - Profile visibility options
  - Video sharing defaults
- Storage management (for students)
- Delete account option

**Actions:**
- Change settings → Save preferences
- Change password → Security confirmation
- Toggle notifications → Update preferences
- Click "Delete Account" → Confirmation process

## Error and Edge Cases

### 1. Video Processing Error
**Screen:** Upload Error
- Error notification
- Description of issue
- Troubleshooting suggestions
- Retry option
- Contact support link

**Actions:**
- Click "Retry" → Restart upload process
- Click "Contact Support" → Support form
- Click "Cancel" → Return to previous screen

### 2. Connectivity Issues
**Screen:** Connection Warning
- Offline alert
- Cached content indication
- Retry connection button
- Limited functionality notice

**Actions:**
- Click "Retry Connection" → Attempt reconnection
- Continue with limited functionality → Access cached content

### 3. Account Recovery
**Screen:** Password Reset
- Email entry field
- Security verification (CAPTCHA)
- "Send Reset Link" button
- Return to login option

**Actions:**
- Enter email → Submit → Confirmation screen
- Click reset link in email → New password screen
- Enter new password → Reset successful → Login