import type { LayoutServerLoad } from './$types';

/**
 * Root layout load — reads the verified session/user once per request and
 * makes it available to every page via `data.session` / `data.user`.
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user,
		cookies: cookies.getAll()
	};
};
