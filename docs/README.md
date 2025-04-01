_Last updated: 2025-04-01 15:15 EST — v1.0_

# Music Education Platform

A web platform for music students to upload performance videos and receive timestamped feedback from teachers. This educational tool bridges the gap between in-person lessons and independent practice through structured, time-specific feedback.

## Project Overview

The Music Education Platform offers a specialized environment for music education, designed to enhance the learning experience by:

1. Enabling students to record and upload practice sessions
2. Allowing teachers to provide precise, timestamp-specific feedback
3. Creating a structured history of performances and progress
4. Facilitating communication between students and teachers

## Repository Structure

```
/
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and API clients
│   │   ├── pages/        # Page components for routes
│   │   ├── App.tsx       # Main application component
│   │   └── main.tsx      # Application entry point
│   ├── index.html        # HTML template
│   └── public/           # Static assets
│
├── server/               # Backend Express application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage implementation
│   └── vite.ts           # Vite server setup
│
├── shared/               # Shared code between client and server
│   └── schema.ts         # Database schema and types
│
├── docs/                 # Project documentation
│   ├── SoftwareBlueprintIntake.md  # Project requirements
│   ├── PRD.md                      # Product requirements document
│   ├── AppFlow.md                  # User flow documentation
│   ├── BackendStructure.md         # Backend architecture
│   ├── TechStack.md                # Technology stack details
│   ├── FrontendGuidelines.md       # Frontend development guidelines
│   ├── ImplementationPlan.md       # Development roadmap
│   ├── TestPlan.md                 # Testing strategy
│   ├── GitWorkflow.md              # Git workflow guidelines
│   └── README.md                   # This file
│
├── drizzle.config.ts     # Drizzle ORM configuration
├── package.json          # Project dependencies and scripts
├── postcss.config.js     # PostCSS configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── theme.json            # Application theme settings
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite bundler configuration
```

## Core Features

- **User Authentication**: Secure login/registration with student and teacher roles
- **Video Upload**: Upload and storage of practice videos
- **Video Playback**: Custom video player with timestamp-specific comments
- **Commenting System**: Leave and view feedback at specific points in videos
- **Video Sharing**: Share videos between students and teachers
- **Dashboard**: View practice history and feedback

## Technology Stack

### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: React Context + TanStack Query
- **UI Components**: Shadcn UI with Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Video Playback**: Plyr

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication
- **File Storage**: Supabase Storage

## Getting Started

### Prerequisites
- Node.js v20+
- npm 9+
- Supabase account (for storage)
- PostgreSQL database (or use in-memory storage for development)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-organization/music-education-platform.git
cd music-education-platform
```

2. Install dependencies:
```bash
npm install
```

3. Environment Variables:
Create a `.env` file in the project root with:
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
DATABASE_URL=your-postgresql-connection-string (optional for development)
JWT_SECRET=your-secret-key
```

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Access the application:
Open your browser and navigate to the provided URL (typically http://localhost:3000).

### Running Tests

```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e        # Run end-to-end tests
```

## Deployment

The application is designed to be deployed on Replit. The deployment process is handled by Replit Deployments, which automatically builds and deploys the application.

To deploy the application:
1. Ensure all tests pass
2. Merge your changes to the main branch
3. Use the Replit deployment interface to deploy the application

## Development Workflow

Please refer to the following documentation for detailed development guidelines:

- [Product Requirements Document](./PRD.md) for feature specifications
- [Application Flow](./AppFlow.md) for user flow documentation
- [Backend Structure](./BackendStructure.md) for backend architecture
- [Frontend Guidelines](./FrontendGuidelines.md) for UI development standards
- [Implementation Plan](./ImplementationPlan.md) for development roadmap
- [Test Plan](./TestPlan.md) for testing strategy
- [Git Workflow](./GitWorkflow.md) for contribution guidelines

## Contributing

1. Create a feature branch from `develop`
2. Make your changes following the project guidelines
3. Ensure tests pass and write new tests for new features
4. Create a pull request with a clear description of your changes
5. Wait for code review and address feedback

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please contact the project maintainers or open an issue on GitHub.