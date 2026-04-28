import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Minimal profile shape used by the auth/onboarding/role-routing flow.
 * Full typing comes when `supabase gen types typescript` lands in a
 * follow-up PR.
 */
export type ProfileEssentials = {
	role: 'instructor' | 'student';
	onboarded: boolean;
};

/**
 * Reads the role/onboarded flags for `userId` from the profiles table.
 *
 * Returns null on missing row or query error. Loaders/actions that
 * require a profile should treat null as "not onboarded yet" and
 * redirect accordingly — the on_auth_user_created trigger normally
 * inserts a row, but loaders shouldn't crash if it's somehow missing.
 */
export async function loadProfileEssentials(
	supabase: SupabaseClient,
	userId: string
): Promise<ProfileEssentials | null> {
	const { data, error } = await supabase
		.from('profiles')
		.select('role, onboarded')
		.eq('id', userId)
		.single();

	if (error || !data) {
		return null;
	}
	return data as ProfileEssentials;
}
