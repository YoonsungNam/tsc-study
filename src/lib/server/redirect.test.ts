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
		it('rejects scheme-relative //host', () => {
			expect(safeNext('//evil.com')).toBe('/');
		});

		it('rejects scheme-relative //host with path', () => {
			expect(safeNext('//evil.com/steal')).toBe('/');
		});

		it('rejects http:// URL', () => {
			expect(safeNext('http://evil.com')).toBe('/');
		});

		it('rejects https:// URL', () => {
			expect(safeNext('https://evil.com')).toBe('/');
		});

		it('rejects relative path without leading slash', () => {
			expect(safeNext('foo')).toBe('/');
		});

		it('rejects javascript: URL', () => {
			expect(safeNext('javascript:alert(1)')).toBe('/');
		});

		it('rejects data: URL', () => {
			expect(safeNext('data:text/html,<script>alert(1)</script>')).toBe('/');
		});
	});
});
