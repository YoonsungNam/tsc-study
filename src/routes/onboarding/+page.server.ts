import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) {
		redirect(303, '/login');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('onboarded')
		.eq('id', user.id)
		.single();

	// Already onboarded — let the root page route them by role.
	if (profile?.onboarded) {
		redirect(303, '/');
	}

	return { email: user.email };
};

export const actions: Actions = {
	default: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { session, user } = await safeGetSession();
		if (!session || !user) {
			redirect(303, '/login');
		}

		const formData = await request.formData();
		const role = String(formData.get('role') ?? '');

		if (role !== 'instructor' && role !== 'student') {
			return fail(400, { error: '역할을 선택해주세요' });
		}

		const { error } = await supabase
			.from('profiles')
			.update({ role, onboarded: true })
			.eq('id', user.id);

		if (error) {
			return fail(500, { error: error.message });
		}

		redirect(303, role === 'instructor' ? '/instructor' : '/');
	}
};
