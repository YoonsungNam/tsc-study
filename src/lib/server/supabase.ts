import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Per-request Supabase client bound to the SvelteKit cookies API.
 * Use via `event.locals.supabase` (set in `hooks.server.ts`).
 */
export function createSupabaseServerClient(event: RequestEvent): SupabaseClient {
	// Auth cookies must NOT carry the `Secure` flag on plain HTTP. Browsers
	// (especially Safari on iOS) refuse to persist Secure cookies on HTTP
	// non-localhost origins, which breaks the auth round-trip for setups like
	// Tailscale dev where the dev server is reached via
	// http://machine.<tailnet>.ts.net:5173 — the user logs in successfully but
	// the session cookie never gets stored, so the next request bounces them
	// back to /login. Localhost is treated as secure by browsers, so it works
	// without this override; non-localhost HTTP needs it.
	//
	// We force Secure based on the actual request protocol: HTTPS in production
	// (Vercel) and HTTP in dev that happens to be non-localhost.
	const isSecure = event.url.protocol === 'https:';

	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/',
						secure: isSecure
					});
				});
			}
		}
	});
}
