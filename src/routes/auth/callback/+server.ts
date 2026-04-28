import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Restrict `next=` to same-origin internal paths only. Rejects:
 *   - missing/empty values  → '/'
 *   - external URLs (`http://...`, `https://...`)
 *   - scheme-relative URLs (`//evil.com`) which browsers resolve as
 *     external when used in `Location:` headers
 * Without this, a crafted callback URL becomes an open-redirect /
 * phishing vector.
 */
function safeNext(value: string | null): string {
	if (!value || !value.startsWith('/') || value.startsWith('//')) {
		return '/';
	}
	return value;
}

/**
 * Magic link landing page. Supabase redirects here with `?code=...` after
 * the user clicks the email link. We exchange the code for a session
 * (sets cookies), then send them to `next` (defaults to root, which
 * handles role-based routing).
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const next = safeNext(url.searchParams.get('next'));

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			redirect(303, next);
		}
	}

	// Code missing or exchange failed — bounce back to login.
	redirect(303, '/login');
};
