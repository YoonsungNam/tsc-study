import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { loadProfileEssentials } from './profile';

/**
 * Build a minimal Supabase client stub that returns `response` from the
 * `.from('profiles').select(...).eq(...).single()` chain we use in the
 * helper. This stays small on purpose — switching to a heavier mocking
 * library would obscure what the helper actually exercises.
 */
function makeSupabaseStub(response: { data: unknown; error: unknown }): SupabaseClient {
	return {
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockReturnValue({
				eq: vi.fn().mockReturnValue({
					single: vi.fn().mockResolvedValue(response)
				})
			})
		})
	} as unknown as SupabaseClient;
}

describe('loadProfileEssentials', () => {
	it('returns the role/onboarded fields when found', async () => {
		const supabase = makeSupabaseStub({
			data: { role: 'instructor', onboarded: true },
			error: null
		});

		const result = await loadProfileEssentials(supabase, 'user-123');

		expect(result).toEqual({ role: 'instructor', onboarded: true });
	});

	it('returns null on query error', async () => {
		const supabase = makeSupabaseStub({
			data: null,
			error: { message: 'rls denied' }
		});

		expect(await loadProfileEssentials(supabase, 'user-123')).toBeNull();
	});

	it('returns null when no row is found', async () => {
		const supabase = makeSupabaseStub({ data: null, error: null });

		expect(await loadProfileEssentials(supabase, 'user-123')).toBeNull();
	});

	it('queries the profiles table by id', async () => {
		const supabase = makeSupabaseStub({
			data: { role: 'student', onboarded: false },
			error: null
		});

		await loadProfileEssentials(supabase, 'user-abc');

		expect(supabase.from).toHaveBeenCalledWith('profiles');
	});
});
