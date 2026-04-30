import { error, fail, redirect } from '@sveltejs/kit';
import { loadClassById } from '$lib/server/classes';
import { createInvite, loadInvitesForClass } from '$lib/server/invites';
import type { Actions, PageServerLoad } from './$types';

/**
 * Load class detail + the instructor's invites for it. RLS already prevents
 * non-owners from reading either; reaching this loader implies authorization
 * via the parent /instructor layout guard plus the row-level checks in
 * 001_initial.sql.
 */
export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const klass = await loadClassById(supabase, params.id);
	if (!klass) {
		error(404, '클래스를 찾을 수 없습니다');
	}

	const invites = await loadInvitesForClass(supabase, params.id);
	return { klass, invites };
};

export const actions: Actions = {
	createInvite: async ({ params, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) {
			redirect(303, '/login');
		}

		const invite = await createInvite(supabase, {
			classId: params.id,
			instructorId: user.id
		});

		if (!invite) {
			return fail(500, { error: '초대 링크 발급에 실패했습니다' });
		}

		// Returning the row triggers `load` to re-run, so the page sees the
		// new invite at the top of `data.invites` without a redirect.
		return { created: true, invite };
	}
};
