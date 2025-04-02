# Replit Agent Integration: Supabase-Only App

This project uses Supabase for all auth, storage, and database logic. You may NOT generate any Express or custom API routes.

## 🧠 Agent Rules:
- Use `supabase-js` for all backend interactions.
- The schema and RLS rules are defined in `/supabase/schema.sql`.
- Auth is handled via `supabase.auth.signUp` and `signInWithPassword`.
- Storage uses `videos/` and `profile-images/` buckets via `supabase.storage`.
- Use the client defined in `/supabase/client.ts`
- Do NOT write or modify RLS policies. They are already defined.

## ✅ Tasks You Can Do:
- Build feature logic using `supabase-js`
- Create pages, forms, and flows (e.g. upload, comment, register)
- Use the schema as your source of truth