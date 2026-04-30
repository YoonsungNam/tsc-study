-- TSC Study: Security hardening for invite flow (P1 + P2 from PR #5 review).
--
-- Three fixes that surfaced in review of feat/class-and-invites — P1 was
-- found independently by @chatgpt-codex-connector (server-action angle)
-- and the human reviewer (RLS angle):
--
-- (P1)  `invites: instructor manage` RLS only verified `auth.uid() =
--       created_by`. It did NOT check that the referenced `class_id`
--       belongs to the inserter, so a malicious instructor could mint
--       invites for another instructor's class. Tighten WITH CHECK so
--       the inserter must own the target class.
--
-- (P2a) `get_invite_preview` returned `coalesce(display_name, email)`
--       as `instructor_name`. Onboarding never asks for display_name,
--       so every preview was leaking the inviting instructor's email
--       address to anyone holding a code. Drop the email fallback in
--       favor of a generic '강사' string.
--
-- (P2b) `redeem_invite` (from 001) incremented `used_count` even when
--       the membership insert hit `on conflict do nothing` (student
--       already a member). With `max_uses` set, repeat clicks burned
--       slots that were never actually consumed. Gate the increment
--       on a real insert via `RETURNING`.
--
-- Apply: paste into Supabase SQL Editor and Run, after 001–003.
--
-- The whole script runs inside one transaction so a mid-script failure
-- doesn't leave the schema in a half-applied state — e.g. `invites`
-- briefly without any policy between the DROP and CREATE. Each DROP
-- carries `IF EXISTS` so the script is safe to re-run.

begin;

-- ------------------------------------------------------------------
-- (P1) Tighten invites RLS — class-ownership check on WITH CHECK
-- ------------------------------------------------------------------

drop policy if exists "invites: instructor manage" on invites;

create policy "invites: instructor manage" on invites for all
	using (auth.uid() = created_by)
	with check (
		auth.uid() = created_by
		and exists (
			select 1 from classes
			where id = invites.class_id
				and instructor_id = auth.uid()
		)
	);

-- Defensive cleanup: purge any invites whose `created_by` doesn't match
-- the class's instructor. The pre-tightening WITH CHECK allowed forged
-- rows where these diverged. We don't expect any in this dev environment
-- (no exploit attempts have been observed) but a one-shot delete here
-- guarantees the table matches the new policy's invariant.
-- Migration scripts run as the `postgres` superuser, which bypasses RLS,
-- so this delete is unrestricted by the just-installed policy.
delete from invites i
where not exists (
	select 1 from classes c
	where c.id = i.class_id
		and c.instructor_id = i.created_by
);

-- ------------------------------------------------------------------
-- (P2a) Drop email fallback from get_invite_preview
-- ------------------------------------------------------------------

drop function if exists get_invite_preview(text);

create function get_invite_preview(invite_code text)
returns table (
	class_name text,
	instructor_name text,
	valid boolean
)
language sql
security definer
set search_path = public
as $$
	select
		c.name as class_name,
		coalesce(p.display_name, '강사') as instructor_name,
		(
			(i.expires_at is null or i.expires_at > now())
			and (i.max_uses is null or i.used_count < i.max_uses)
		) as valid
	from invites i
	join classes c on c.id = i.class_id
	join profiles p on p.id = c.instructor_id
	where i.code = invite_code
	limit 1;
$$;

grant execute on function get_invite_preview(text) to anon, authenticated;

-- ------------------------------------------------------------------
-- (P2b) Bump used_count only on a real insert (not on-conflict no-op)
-- ------------------------------------------------------------------

create or replace function redeem_invite(invite_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
	v_invite invites%rowtype;
	v_inserted_class uuid;
begin
	if auth.uid() is null then
		raise exception 'Authentication required';
	end if;

	select * into v_invite from invites where code = invite_code for update;

	if not found then
		raise exception 'Invalid invite code';
	end if;

	if v_invite.expires_at is not null and v_invite.expires_at < now() then
		raise exception 'Invite expired';
	end if;

	if v_invite.max_uses is not null and v_invite.used_count >= v_invite.max_uses then
		raise exception 'Invite usage limit reached';
	end if;

	-- on conflict do nothing + returning: returning emits a row ONLY when
	-- a new row was inserted. Existing membership → no row → we skip the
	-- counter bump, so re-clicks don't burn `max_uses` slots.
	insert into memberships (class_id, student_id)
	values (v_invite.class_id, auth.uid())
	on conflict do nothing
	returning class_id into v_inserted_class;

	if v_inserted_class is not null then
		update invites set used_count = used_count + 1 where id = v_invite.id;
	end if;

	return v_invite.class_id;
end;
$$;

commit;
