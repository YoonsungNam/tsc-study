-- TSC Study: Add `onboarded` flag to profiles.
--
-- The `on_auth_user_created` trigger in 001_initial.sql creates a profile
-- row with the default role='student'. That collides with two states we
-- need to distinguish:
--   - "new user, hasn't picked a role yet"   → show /onboarding
--   - "real student who chose 'student'"      → student home
-- An explicit boolean closes the gap without complicating the role enum.
--
-- onboarded = false → /onboarding (role selection required)
-- onboarded = true  → role reflects an actual user choice

alter table profiles add column onboarded boolean not null default false;
