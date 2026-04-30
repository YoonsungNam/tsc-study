import { loadClassesForInstructor } from '$lib/server/classes';
import type { PageServerLoad } from './$types';

/**
 * Layout (`+layout.server.ts`) already guarded auth + role; we only need
 * `user.id` here to filter classes. RLS would also enforce ownership, but
 * filtering server-side avoids fetching rows we'd then drop.
 */
export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		// Layout would have already redirected, but typecheck needs the guard.
		return { classes: [] };
	}

	const classes = await loadClassesForInstructor(supabase, user.id);
	return { classes };
};
