import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { loadProfileEssentials } from './profile';

/**
 * Build a minimal Supabase client stub. Returns both the stub client and
 * the individual chain mocks so tests can assert which methods were called
 * and with what arguments. We keep the chain hand-rolled (vs. a heavier
 * mocking library) so the test stays close to the surface the helper
 * actually uses.
 */
function makeSupabaseStub(response: { data: unknown; error: unknown }) {
	const single = vi.fn().mockResolvedValue(response);
	const eq = vi.fn().mockReturnValue({ single });
	const select = vi.fn().mockReturnValue({ eq });
	const from = vi.fn().mockReturnValue({ select });

	const client = { from } as unknown as SupabaseClient;
	return { client, mocks: { from, select, eq, single } };
}

describe('loadProfileEssentials', () => {
	it('returns the role/onboarded fields when found', async () => {
		const { client } = makeSupabaseStub({
			data: { role: 'instructor', onboarded: true },
			error: null
		});

		const result = await loadProfileEssentials(client, 'user-123');

		expect(result).toEqual({ role: 'instructor', onboarded: true });
	});

	it('returns null on query error', async () => {
		const { client } = makeSupabaseStub({
			data: null,
			error: { message: 'rls denied' }
		});

		expect(await loadProfileEssentials(client, 'user-123')).toBeNull();
	});

	it('returns null when no row is found', async () => {
		const { client } = makeSupabaseStub({ data: null, error: null });

		expect(await loadProfileEssentials(client, 'user-123')).toBeNull();
	});

	it('queries the profiles table for role/onboarded by user id', async () => {
		const { client, mocks } = makeSupabaseStub({
			data: { role: 'student', onboarded: false },
			error: null
		});

		await loadProfileEssentials(client, 'user-abc');

		expect(mocks.from).toHaveBeenCalledWith('profiles');
		expect(mocks.select).toHaveBeenCalledWith('role, onboarded');
		expect(mocks.eq).toHaveBeenCalledWith('id', 'user-abc');
	});
});
