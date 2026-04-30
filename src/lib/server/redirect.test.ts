import { describe, expect, it } from 'vitest';
import { safeNext } from './redirect';

describe('safeNext', () => {
	describe('falsy / missing input', () => {
		it('returns / for null', () => {
			expect(safeNext(null)).toBe('/');
		});

		it('returns / for undefined', () => {
			expect(safeNext(undefined)).toBe('/');
		});

		it('returns / for empty string', () => {
			expect(safeNext('')).toBe('/');
		});
	});

	describe('valid internal paths', () => {
		it('passes through root', () => {
			expect(safeNext('/')).toBe('/');
		});

		it('passes through simple path', () => {
			expect(safeNext('/instructor')).toBe('/instructor');
		});

		it('passes through deep path', () => {
			expect(safeNext('/class/abc/track/xyz')).toBe('/class/abc/track/xyz');
		});

		it('passes through path with query string', () => {
			expect(safeNext('/foo?x=1&y=2')).toBe('/foo?x=1&y=2');
		});

		it('passes through path with fragment', () => {
			expect(safeNext('/foo#bar')).toBe('/foo#bar');
		});
	});

	describe('open-redirect attempts', () => {
		// Table-driven so adding a new bypass family is one row, not a new it()
		// block. Cover the practical bypass shapes:
		//   - scheme-relative '//host' (browsers resolve as external)
		//   - explicit external URLs (http://, https://)
		//   - non-http schemes that browsers honor in some places
		//     (javascript:, data:)
		//   - missing leading slash (treated as relative-to-current-path)
		//   - backslash-injection / Windows-path quirks (defense-in-depth)
		it.each([
			'//evil.com',
			'//evil.com/steal',
			'http://evil.com',
			'https://evil.com',
			'javascript:alert(1)',
			'data:text/html,<script>alert(1)</script>',
			'foo',
			'/\\evil.com',
			'/legitimate\\evil',
			'\\\\evil.com'
		])('rejects %j', (input) => {
			expect(safeNext(input)).toBe('/');
		});
	});
});
