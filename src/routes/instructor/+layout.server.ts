import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * Guard for the entire /instructor subtree:
 *   - not signed in        → /login
 *   - not yet onboarded    → /onboarding
 *   - role !== 'instructor' → /
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) {
		redirect(303, '/login');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('role, onboarded')
		.eq('id', user.id)
		.single();

	if (!profile?.onboarded) {
		redirect(303, '/onboarding');
	}

	if (profile.role !== 'instructor') {
		redirect(303, '/');
	}

	return { email: user.email, role: profile.role };
};
