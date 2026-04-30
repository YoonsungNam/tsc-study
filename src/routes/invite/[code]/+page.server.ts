import { fail, redirect } from '@sveltejs/kit';
import { getInvitePreview, redeemInvite } from '$lib/server/invites';
import type { Actions, PageServerLoad } from './$types';

/**
 * Public-facing invite landing page.
 *
 * - Anyone (signed in or not) sees a preview of which class they're being
 *   invited to and by whom.
 * - Signed-in users hit the `redeem` action to call `redeem_invite` and
 *   be added to the class.
 * - Anonymous visitors hit `signIn` to receive a magic link that returns
 *   them here after auth (so they can then click join).
 */
export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const preview = await getInvitePreview(supabase, params.code);
	const { session, user } = await safeGetSession();

	return {
		code: params.code,
		preview,
		signedIn: !!session && !!user,
		email: user?.email ?? null
	};
};

export const actions: Actions = {
	redeem: async ({ params, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) {
			// Should not normally happen — UI hides this action when signed
			// out — but guard anyway.
			redirect(303, `/invite/${params.code}`);
		}

		const result = await redeemInvite(supabase, params.code);
		if ('error' in result) {
			return fail(400, { error: result.error });
		}

		// Membership created (or already existed). Root routes the user by role.
		redirect(303, '/');
	},

	signIn: async ({ params, request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = String(formData.get('email') ?? '').trim();

		if (!email) {
			return fail(400, { error: '이메일을 입력해주세요' });
		}

		// Magic link returns to the same invite page so the now-authenticated
		// user can click "Join". `next=` is validated by /auth/callback's
		// safeNext helper before being honored.
		const { error } = await supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback?next=/invite/${params.code}`
			}
		});

		if (error) {
			return fail(400, { error: error.message, email });
		}

		return { sent: true, email };
	}
};
