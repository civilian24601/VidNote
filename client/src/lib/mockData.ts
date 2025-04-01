import { User, Video, Comment, VideoSharing } from "@shared/schema";

// Mock user data
export const MOCK_USERS: User[] = [
  {
    id: 1,
    username: "student_demo",
    email: "student@example.com",
    password: "password123", // This would not be exposed in a real app
    fullName: "Student Demo",
    role: "student",
    avatarUrl: null,
    instruments: ["Piano", "Guitar"],
    experienceLevel: "Intermediate",
    bio: "Music student passionate about classical piano and acoustic guitar.",
    verified: true,
    active: true,
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
  },
  {
    id: 2,
    username: "teacher_demo",
    email: "teacher@example.com",
    password: "password123", // This would not be exposed in a real app
    fullName: "Teacher Demo",
    role: "teacher",
    avatarUrl: null,
    instruments: ["Violin", "Piano"],
    experienceLevel: "Expert",
    bio: "Conservatory-trained music teacher with 15+ years of experience.",
    verified: true,
    active: true,
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
  },
  {
    id: 3,
    username: "piano_master",
    email: "piano@example.com",
    password: "password123",
    fullName: "Maria Johnson",
    role: "teacher",
    avatarUrl: null,
    instruments: ["Piano"],
    experienceLevel: "Expert",
    bio: "Piano specialist with focus on classical repertoire and performance technique.",
    verified: true,
    active: true,
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000)
  },
  {
    id: 4,
    username: "theory_teacher",
    email: "theory@example.com",
    password: "password123",
    fullName: "Robert Chen",
    role: "teacher",
    avatarUrl: null,
    instruments: ["Piano", "Music Theory"],
    experienceLevel: "Expert",
    bio: "Specializing in music theory, composition, and advanced piano techniques.",
    verified: true,
    active: true,
    lastLogin: new Date(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
  }
];

// Mock video data
export const MOCK_VIDEOS: Video[] = [
  {
    id: 1,
    title: "Bach Prelude in C Major",
    description: "My practice session for the Bach prelude.",
    url: "https://example.com/videos/bach-prelude.mp4",
    thumbnailUrl: "https://example.com/thumbnails/bach-prelude.jpg",
    userId: 1,
    pieceName: "Prelude in C Major",
    composer: "Johann Sebastian Bach",
    practiceGoals: "Improve articulation and evenness of sixteenth notes",
    isPublic: false,
    duration: 180, // 3 minutes
    videoStatus: "ready",
    viewCount: 12,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2,
    title: "Chopin Nocturne Op. 9 No. 2",
    description: "Working on the middle section and phrasing.",
    url: "https://example.com/videos/chopin-nocturne.mp4",
    thumbnailUrl: "https://example.com/thumbnails/chopin-nocturne.jpg",
    userId: 1,
    pieceName: "Nocturne Op. 9 No. 2",
    composer: "Frédéric Chopin",
    practiceGoals: "Focus on rubato and dynamic contrast",
    isPublic: false,
    duration: 270, // 4:30 minutes
    videoStatus: "ready",
    viewCount: 8,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // Updated 8 days ago
  },
  {
    id: 3,
    title: "Mozart Sonata K.545 Movement 1",
    description: "First attempt at the exposition section.",
    url: "https://example.com/videos/mozart-sonata.mp4",
    thumbnailUrl: "https://example.com/thumbnails/mozart-sonata.jpg",
    userId: 1,
    pieceName: "Sonata in C Major K.545",
    composer: "Wolfgang Amadeus Mozart",
    practiceGoals: "Clean execution of scales and ornaments",
    isPublic: false,
    duration: 330, // 5:30 minutes
    videoStatus: "ready",
    viewCount: 5,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
  },
  {
    id: 4,
    title: "Scales Practice - G Major",
    description: "Daily scales routine, focus on G Major.",
    url: "https://example.com/videos/g-major-scales.mp4",
    thumbnailUrl: "https://example.com/thumbnails/g-major-scales.jpg",
    userId: 1,
    pieceName: "G Major Scale",
    composer: null,
    practiceGoals: "Evenness and speed",
    isPublic: false,
    duration: 120, // 2 minutes
    videoStatus: "ready",
    viewCount: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

// Mock comment data
export const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    videoId: 1,
    userId: 2, // Teacher Demo
    content: "Great start! Pay attention to the evenness of the 16th notes in measure 5.",
    timestamp: 45, // At 0:45
    category: "technique",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2,
    videoId: 1,
    userId: 2, // Teacher Demo
    content: "Try to emphasize the bass line a bit more here to bring out the harmonic progression.",
    timestamp: 90, // At 1:30
    category: "musicality",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
  },
  {
    id: 3,
    videoId: 1,
    userId: 1, // Student reply
    content: "I'll work on that! Should I use the pedal less here?",
    timestamp: 90, // At 1:30
    category: null,
    parentCommentId: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 4,
    videoId: 1,
    userId: 2, // Teacher Demo's reply to student
    content: "Yes, try with less pedal and listen for how the bass notes connect.",
    timestamp: 90, // At 1:30
    category: null,
    parentCommentId: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  // Piano teacher comments
  {
    id: 5,
    videoId: 1,
    userId: 3, // Maria Johnson (Piano specialist)
    content: "Your hand position looks good. Try to keep your wrists a bit more relaxed in the arpeggios.",
    timestamp: 65, // At 1:05
    category: "technique",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 6,
    videoId: 1,
    userId: 3, // Maria Johnson (Piano specialist)
    content: "I'd like to hear more direction in this phrase. Think of it as one long line building to measure 12.",
    timestamp: 120, // At 2:00
    category: "phrasing",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  // Theory teacher comments
  {
    id: 7,
    videoId: 1,
    userId: 4, // Robert Chen (Theory specialist)
    content: "Notice how Bach uses this harmonic progression. The bass line creates a descending pattern that supports the entire prelude structure.",
    timestamp: 30, // At 0:30
    category: "theory",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  // Chopin Nocturne comments
  {
    id: 8,
    videoId: 2,
    userId: 2, // Teacher Demo
    content: "Beautiful tone in the opening! For the rubato, try to keep a sense of forward motion.",
    timestamp: 30, // At 0:30
    category: "interpretation",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 9,
    videoId: 2,
    userId: 2, // Teacher Demo
    content: "The left hand accompaniment could be softer here to highlight the melody.",
    timestamp: 120, // At 2:00
    category: "balance",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 10,
    videoId: 2,
    userId: 3, // Maria Johnson (Piano specialist)
    content: "The fioritura at 1:35 should feel freer. Let it float above the pulse rather than fitting it strictly to the beat.",
    timestamp: 95, // At 1:35
    category: "technique",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
    updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  },
  // Mozart Sonata comments
  {
    id: 11,
    videoId: 3,
    userId: 2, // Teacher Demo
    content: "Good articulation! Watch out for the rhythm in this passage.",
    timestamp: 60, // At 1:00
    category: "rhythm",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  },
  {
    id: 12,
    videoId: 3,
    userId: 4, // Robert Chen (Theory specialist)
    content: "Notice the classical form here - this exposition follows sonata form perfectly. Try to highlight the contrast between the first and second themes.",
    timestamp: 120, // At 2:00
    category: "theory",
    parentCommentId: null,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
    updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)
  }
];

// Mock video sharing data
export const MOCK_SHARINGS: VideoSharing[] = [
  // Teacher Demo shares
  {
    id: 1,
    videoId: 1, // Bach Prelude
    userId: 2, // Shared with Teacher Demo
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    id: 2,
    videoId: 2, // Chopin Nocturne
    userId: 2, // Shared with Teacher Demo
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
  },
  {
    id: 3,
    videoId: 3, // Mozart Sonata
    userId: 2, // Shared with Teacher Demo
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
  },
  // Maria Johnson (Piano specialist) shares
  {
    id: 4,
    videoId: 1, // Bach Prelude
    userId: 3, // Shared with Piano specialist
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
  },
  {
    id: 5,
    videoId: 2, // Chopin Nocturne
    userId: 3, // Shared with Piano specialist
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
  },
  // Robert Chen (Theory specialist) shares
  {
    id: 6,
    videoId: 1, // Bach Prelude
    userId: 4, // Shared with Theory specialist
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    id: 7,
    videoId: 3, // Mozart Sonata
    userId: 4, // Shared with Theory specialist
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // 14 days ago
  }
];