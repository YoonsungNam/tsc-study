import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event);

	/**
	 * `getSession()` alone reads the cookie without verifying — use
	 * `getUser()` for actual JWT validation. This combined helper avoids
	 * trusting an unverified session in protected loads/actions.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) {
			return { session: null, user: null };
		}

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) {
			// JWT validation failed — treat as unauthenticated.
			return { session: null, user: null };
		}

		return { session, user };
	};

	return resolve(event, {
		// Supabase SSR sets non-standard headers SvelteKit doesn't pass through
		// by default. Allow it explicitly.
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
