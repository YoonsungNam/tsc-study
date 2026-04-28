import { redirect } from '@sveltejs/kit';
import { loadProfileEssentials } from '$lib/server/profile';
import type { PageServerLoad } from './$types';

/**
 * Root entry point. Routes the user based on auth + onboarding + role:
 *   - not signed in     → /login
 *   - not onboarded     → /onboarding
 *   - role=instructor   → /instructor
 *   - role=student      → stay here (student home, fleshed out in Phase 3)
 */
export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) {
		redirect(303, '/login');
	}

	const profile = await loadProfileEssentials(supabase, user.id);

	if (!profile?.onboarded) {
		redirect(303, '/onboarding');
	}

	if (profile.role === 'instructor') {
		redirect(303, '/instructor');
	}

	// Student — show the (placeholder) student home.
	return { email: user.email, role: profile.role };
};
