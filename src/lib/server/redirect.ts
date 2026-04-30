/**
 * Restrict a `next=`-style redirect target to same-origin internal paths.
 * Rejects:
 *   - missing/empty values             → '/'
 *   - paths without a leading slash    → '/'
 *   - scheme-relative `//host`          → '/' (browsers resolve as external)
 *   - external URLs (http://, https://) → '/'
 *   - paths containing `\`              → '/' (defense-in-depth: modern
 *                                              browsers treat them as literal,
 *                                              but historic Windows-path quirks
 *                                              have allowed escapes in older
 *                                              UAs / proxies)
 *
 * Without this, any handler that honors a `next=` query param becomes an
 * open-redirect / phishing vector (attacker crafts a link that bounces a
 * freshly-authenticated user off-site after sign-in).
 */
export function safeNext(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
		return '/';
	}
	return value;
}
