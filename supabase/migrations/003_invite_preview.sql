-- TSC Study: Public preview RPC for invite codes.
--
-- The `invites: instructor manage` RLS policy in 001_initial.sql limits
-- direct SELECT on `invites` to the inviting instructor. That blocks the
-- /invite/[code] page (which a student visits before authenticating)
-- from showing "you're being invited to <class> by <instructor>".
--
-- Solution: a SECURITY DEFINER RPC that returns ONLY non-sensitive
-- preview fields (class name, instructor display name, validity flag).
-- No user identifiers, no usage counts beyond the validity boolean.
--
-- Apply: paste into Supabase SQL Editor and Run, after 001 and 002.

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
		coalesce(p.display_name, p.email) as instructor_name,
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

-- Grant to both anon (unauthenticated student arriving via shared link)
-- and authenticated (logged-in user clicking an invite link).
grant execute on function get_invite_preview(text) to anon, authenticated;
