-- TSC Study: Break the classes ↔ memberships RLS recursion (PR #5 fix).
--
-- The original classes:SELECT and memberships:SELECT policies in 001
-- mutually reference each other:
--   - classes policy:     "OR EXISTS (SELECT 1 FROM memberships ...)"
--   - memberships policy: "OR EXISTS (SELECT 1 FROM classes ...)"
--
-- Postgres correctly detects this as infinite recursion when evaluating
-- either policy, returning SQLSTATE 42P17 ("infinite recursion detected
-- in policy for relation"). This blocks more than just SELECT — any
-- `INSERT ... RETURNING` on classes triggers the SELECT policy on the
-- returned row, so even basic class creation breaks.
--
-- The bug has been latent since 001 because no code path until PR #5's
-- `createClass` actually ran an authenticated INSERT/SELECT on classes
-- (profiles are populated by trigger, memberships only by the
-- SECURITY DEFINER `redeem_invite` RPC).
--
-- Fix: extract the cross-table existence checks into SECURITY DEFINER
-- helper functions. Inside the helpers, the queries don't go through
-- the policy (definer privileges bypass RLS), so neither table's
-- policy needs to recurse through the other.
--
-- Apply: paste into Supabase SQL Editor and Run, after 001–004.

begin;

-- ---------------------------------------------------------------
-- Helper: is the current user a member of `target_class_id`?
-- SECURITY DEFINER bypasses memberships RLS for this lookup so the
-- caller's policy doesn't recurse back through it.
-- ---------------------------------------------------------------

create or replace function user_is_class_member(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
	select exists (
		select 1 from memberships
		where memberships.class_id = target_class_id
			and memberships.student_id = auth.uid()
	);
$$;

grant execute on function user_is_class_member(uuid) to authenticated;

-- ---------------------------------------------------------------
-- Helper: does the current user instruct (own) `target_class_id`?
-- ---------------------------------------------------------------

create or replace function user_owns_class(target_class_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
	select exists (
		select 1 from classes
		where classes.id = target_class_id
			and classes.instructor_id = auth.uid()
	);
$$;

grant execute on function user_owns_class(uuid) to authenticated;

-- ---------------------------------------------------------------
-- Replace classes SELECT policy — calls the helper instead of an
-- inline EXISTS that would re-enter memberships' policy.
-- ---------------------------------------------------------------

drop policy if exists "classes: instructor or member select" on classes;

create policy "classes: instructor or member select" on classes for select
	using (
		auth.uid() = instructor_id
		or user_is_class_member(classes.id)
	);

-- ---------------------------------------------------------------
-- Replace memberships SELECT policy — same idea, calling
-- user_owns_class instead of an inline EXISTS into classes.
-- ---------------------------------------------------------------

drop policy if exists "memberships: self or instructor select" on memberships;

create policy "memberships: self or instructor select" on memberships for select
	using (
		auth.uid() = student_id
		or user_owns_class(memberships.class_id)
	);

commit;
