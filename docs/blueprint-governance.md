# VidNote Blueprint Governance

## Agent Configuration

### Default Mode
- Frontend-only development
- No custom backend endpoints or APIs

### Allowed Packages
- @supabase/supabase-js
- react
- react-dom
- tailwindcss
- @radix-ui/react-*
- lucide-react
- framer-motion

### Disallowed Patterns
- express
- next
- fastify
- custom backend endpoints

### Data Sources
- supabase/client.ts
- supabase/schema.sql

### Warnings
- Do not generate API routes
- All business logic lives on the frontend with Supabase
- RLS policies already exist — do not edit them

### Goals
- Build frontend flows using Supabase as the only backend
- Honor data and role structures defined in Supabase
- Only use user_metadata fallback if user profile fetch fails
- Align all features with Product and Implementation docs

## Documentation Structure

### Reference Files
- docs/README.md
- docs/PRD.md
- docs/BackendStructure.md
- docs/TechStack.md
- docs/ImplementationPlan.md
- docs/TestPlan.md
- docs/AppFlow.md
- docs/project_overview.md
- docs/GitWorkflow.md
- docs/README_AGENT.md

### Documentation Purpose
- These files contain the source-of-truth for features, logic, schema design, workflows, and priorities
- Use @PRD to understand product requirements
- Use @BackendStructure to reason about Supabase schema
- Use @AppFlow for routing and component hierarchy
- Use @TestPlan to validate completed tasks
- Use @ImplementationPlan for project phase alignment
- Use @TechStack to ensure compatible library usage
- Use @README_AGENT to guide your scope and constraints

## Documentation Maintenance

### Versioning
- Each doc contains a `_Last updated: YYYY-MM-DD HH:mm EST — vX.X_` header
- Do not update any doc without also bumping the version and timestamp

### Automation
- If a code update causes a misalignment with a doc, offer to update that doc with the relevant change
- If a new feature is implemented, automatically draft a PRD section or TestPlan case for approval

## Schema Governance

### Version Control
- All schema changes must be versioned using semantic versioning (MAJOR.MINOR.PATCH)
- Schema version is tracked in `shared/schema.ts` via `SCHEMA_VERSION`
- Major version changes require:
  - Migration plan
  - Backward compatibility layer
  - Documentation updates
  - Team review

### Schema Location
- All schema definitions live in `shared/schema.ts`
- No duplicate schema definitions in client or server
- Client and server import types from shared schema

### Schema Structure
1. Database Models
   - Define base database tables and relationships
   - Use Zod for runtime validation
   - Include all required fields and constraints

2. Insert Schemas
   - Define valid data for creating new records
   - Omit auto-generated fields (id, timestamps)
   - Include all required fields with validation

3. Extended Types
   - Define client-side specific types
   - Extend base types with additional fields
   - Include computed/derived fields

### Validation Rules
- All data must be validated using Zod schemas
- Use `validateSchema` function for runtime validation
- Validation errors must be handled gracefully
- Client and server must validate data independently

### Type Safety
- Use TypeScript for compile-time type checking
- Avoid `any` types
- Use strict null checks
- Document complex types with comments

### Migration Process
1. Update schema version
2. Create migration script
3. Test backward compatibility
4. Update documentation
5. Deploy changes

### Documentation
- Document all schema changes
- Include examples of valid data
- Document validation rules
- Keep migration history 