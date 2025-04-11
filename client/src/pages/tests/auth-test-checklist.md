# Authentication Testing Checklist

## 1. Registration Test
- [ ] Navigate to test-auth page
- [ ] Enter a new email and password
- [ ] Click Sign Up
- [ ] Verify in the Auth State section that:
  - [ ] User object is populated
  - [ ] isAuthenticated is true
- [ ] Check Supabase dashboard to verify:
  - [ ] User exists in Auth users
  - [ ] Profile exists in users table

## 2. Login Test
- [ ] Sign out using the Sign Out button
- [ ] Enter your email and password
- [ ] Click Sign In
- [ ] Verify in the Auth State section that:
  - [ ] User object is populated with correct data
  - [ ] isAuthenticated is true
- [ ] Verify console logs show profile was fetched

## 3. Logout Test
- [ ] Ensure you're logged in
- [ ] Click Sign Out
- [ ] Verify in the Auth State section that:
  - [ ] User is null
  - [ ] isAuthenticated is false
  - [ ] You are redirected to home page (may need to manually verify)

## 4. Session Persistence Test
- [ ] Log in if not already logged in
- [ ] Refresh the page
- [ ] Verify in the Auth State section that:
  - [ ] User data is still present
  - [ ] isAuthenticated is still true
  - [ ] Session object is populated

## 5. Profile Update Test
- [ ] Ensure you're logged in
- [ ] Modify the Full Name and Bio fields
- [ ] Click Update Profile
- [ ] Verify in the Auth State section that:
  - [ ] User object shows updated values
- [ ] Check Supabase dashboard to verify:
  - [ ] User metadata is updated in Auth
  - [ ] Profile is updated in users table

<div className="p-4 max-w-4xl mx-auto text-black">
  {/* All your test page content */}
</div>