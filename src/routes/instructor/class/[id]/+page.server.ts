import { error, fail, redirect } from '@sveltejs/kit';
import { loadClassById } from '$lib/server/classes';
import { createInvite, loadInvitesForClass } from '$lib/server/invites';
import type { Actions, PageServerLoad } from './$types';

/**
 * Load class detail + the instructor's invites for it.
 *
 * Layered authorization:
 *   1. Parent /instructor layout enforced role='instructor'
 *   2. Classes RLS lets through both owners and class members (so a
 *      student member could read this class). We add an explicit
 *      `instructor_id === user.id` check here so a non-owner instructor
 *      (e.g. one who got into the class as a "member" via the now-fixed
 *      P1 invite-forge bug) gets a clean 403 instead of a partial render.
 *   3. Invites RLS limits reads to the instructor who owns each invite,
 *      so `loadInvitesForClass` is implicitly safe even without (2).
 */
export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
	const { user } = await safeGetSession();
	if (!user) {
		redirect(303, '/login');
	}

	const klass = await loadClassById(supabase, params.id);
	if (!klass) {
		error(404, '클래스를 찾을 수 없습니다');
	}
	if (klass.instructor_id !== user.id) {
		error(403, '권한이 없습니다');
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

		// Belt-and-suspenders: even though migration 004 tightens the invites
		// WITH CHECK to require class ownership, do the same check server-side
		// so a non-owner gets a clean fail() with a helpful message instead of
		// an opaque RLS denial bubbling out of `createInvite`.
		const klass = await loadClassById(supabase, params.id);
		if (!klass || klass.instructor_id !== user.id) {
			return fail(403, { error: '권한이 없습니다' });
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
