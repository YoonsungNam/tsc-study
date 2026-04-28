import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Magic link landing page. Supabase redirects here with `?code=...` after
 * the user clicks the email link. We exchange the code for a session
 * (sets cookies), then send them to `next` (defaults to root, which
 * handles role-based routing).
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
	}

	// Code missing or exchange failed — bounce back to login.
	redirect(303, '/login');
};
