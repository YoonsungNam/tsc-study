import { fail, redirect } from '@sveltejs/kit';
import { createClass } from '$lib/server/classes';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals: { safeGetSession, supabase } }) => {
		const { user } = await safeGetSession();
		if (!user) {
			redirect(303, '/login');
		}

		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim() || null;

		if (!name) {
			return fail(400, { error: '클래스 이름을 입력해주세요', name, description });
		}

		const klass = await createClass(supabase, user.id, { name, description });
		if (!klass) {
			return fail(500, { error: '클래스 생성에 실패했습니다', name, description });
		}

		redirect(303, `/instructor/class/${klass.id}`);
	}
};
