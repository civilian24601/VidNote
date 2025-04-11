_Last updated: 2025-04-01 14:50 EST — v1.0_

# Technology Stack

## Frontend

### Core Framework
- **Framework**: React 18
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Package Manager**: npm

### State Management and Data Fetching
- **State Management**: React Context API for global state
- **Data Fetching**: TanStack Query (React Query) v5
- **Form Management**: React Hook Form with Zod validation

### Routing and Navigation
- **Router**: wouter (lightweight alternative to React Router)

### UI Component Library
- **Component Framework**: Shadcn UI (based on Radix UI primitives)
- **CSS Framework**: Tailwind CSS 3.x
- **Icons**: Lucide React for interface icons, React Icons for brand icons
- **Animations**: Framer Motion for component animations
- **Toast Notifications**: Custom toast system built with Radix UI

### Video Playback
- **Player**: Plyr (HTML5 video player)
- **Streaming**: HLS.js for adaptive streaming support
- **Time Markers**: Custom implementation for timestamp comments

### Date & Time Handling
- **Library**: date-fns for all date formatting and manipulation

### Charts and Visualizations
- **Library**: Recharts for data visualization components

## Backend

### Core Framework
- **Framework**: Express.js
- **Language**: TypeScript
- **Runtime**: Node.js v20 LTS

### API Architecture
- **Pattern**: RESTful API
- **Documentation**: OpenAPI/Swagger

### Database
- **Primary Database**: PostgreSQL 15+
- **ORM**: Drizzle ORM
- **Migrations**: Drizzle Kit
- **Connection Pooling**: pg Pool
- **Type Generation**: Drizzle Zod for schema validation and types

### Authentication & Authorization
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Session Management**: Express Session with PostgreSQL store
- **Authorization**: Custom RBAC middleware

### File Storage
- **Service**: Supabase Storage
- **Video Processing**: FFmpeg (server-side processing)
- **Image Processing**: Sharp for thumbnail generation and image processing

### Email Service
- **Provider**: SendGrid
- **Templates**: Handlebars for email templates

### Validation
- **Library**: Zod for schema validation and type inference

## DevOps & Infrastructure

### Hosting Platform
- **Application Hosting**: Replit
- **Database Hosting**: Neon PostgreSQL (serverless)
- **Media Storage**: Supabase Storage

### CI/CD
- **Build Process**: Cursor
- **Deployment Strategy**: Continuous deployment on main branch

### Monitoring & Logging
- **Application Monitoring**: Sentry for error tracking
- **Performance Monitoring**: Built-in Replit metrics
- **Logging**: Structured JSON logging

## Testing Framework

### Frontend Testing
- **Unit Testing**: Vitest
- **Component Testing**: React Testing Library
- **End-to-End Testing**: Playwright

### Backend Testing
- **Unit Testing**: Vitest
- **API Testing**: Supertest

### Testing Utilities
- **Mocking**: Mock Service Worker (MSW)
- **Test Data Generation**: Faker.js

## Development Tools

### Code Quality
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Pre-commit Hooks**: Husky with lint-staged

### Type Checking
- **Type System**: TypeScript strict mode
- **Type Generation**: Drizzle Zod for database types

### Development Environment
- **Editor Config**: VSCode settings
- **Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Error Translator

## Security Measures

### Authentication Security
- **Token Strategy**: Short-lived JWTs with refresh tokens
- **Password Policy**: Zod validation for strong passwords
- **Rate Limiting**: Express rate limit for login attempts

### API Security
- **CORS**: Configured for production and development
- **Content Security Policy**: Strict CSP headers
- **Security Headers**: Helmet.js for HTTP headers
- **Input Validation**: Zod schemas for all API inputs

### Data Protection
- **PII Handling**: Encrypted storage of sensitive information
- **Data Backup**: Automated database backups

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Route-based code splitting
- **Image Optimization**: Responsive images, WebP format
- **Bundle Optimization**: Tree-shaking, minification
- **Lazy Loading**: For components and routes

### Backend Performance
- **Caching**: Response caching for common requests
- **Database Indexing**: Strategic indexes for query optimization
- **Connection Pooling**: Optimized database connections

## Accessibility

### Standards Compliance
- **Guidelines**: WCAG 2.1 AA compliance
- **Semantic HTML**: Proper use of HTML5 elements
- **ARIA**: Appropriate ARIA attributes for complex components

### Testing Tools
- **Automated Testing**: axe-core for accessibility testing
- **Manual Testing**: Keyboard navigation verification checklist

## Versioning & Compatibility

### Browser Support
- **Target Browsers**: Latest 2 versions of major browsers
- **Minimum Support**: ES6 compatible browsers
- **Mobile Browsers**: iOS Safari 14+, Android Chrome 85+

### Polyfills & Fallbacks
- **Strategy**: Feature detection with graceful degradation
- **Core Polyfills**: Minimal core functionality polyfills through Vite

## Third-Party Integrations

### External Services
- **Media Storage**: Supabase Storage
- **Authentication**: Custom JWT implementation
- **Email Delivery**: SendGrid

### Analytics
- **Usage Analytics**: (Future) Simple Analytics or Plausible
- **Performance Metrics**: Web Vitals tracking