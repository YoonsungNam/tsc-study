import type { LayoutServerLoad } from './$types';

/**
 * Root layout load — reads the verified session/user once per request and
 * makes it available to every page via `data.session` / `data.user`.
 *
 * Note: do NOT include `cookies.getAll()` in the return. SvelteKit
 * serializes load return values into PageData visible to client JS; that
 * would leak the Supabase auth cookies (which are HttpOnly server-side
 * by design). The cookies-in-load pattern is only needed when paired
 * with a browser-side `createBrowserClient` to keep them in sync, which
 * we don't use (this app is server-only for auth).
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session, user } = await safeGetSession();

	return {
		session,
		user
	};
};
