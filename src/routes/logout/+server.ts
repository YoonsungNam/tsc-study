import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST-only to avoid accidental logout via GET (e.g., link prefetch).
 * Forms anywhere in the app can sign out via:
 *
 *   <form method="POST" action="/logout"><button>Sign out</button></form>
 */
export const POST: RequestHandler = async ({ locals: { supabase } }) => {
	await supabase.auth.signOut();
	redirect(303, '/login');
};
