import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { createClass, loadClassById, loadClassesForInstructor } from './classes';

/** Chain ending in `.order()` — the list-style query we use for class rosters. */
function makeListStub(response: { data: unknown; error: unknown }) {
	const order = vi.fn().mockResolvedValue(response);
	const eq = vi.fn().mockReturnValue({ order });
	const select = vi.fn().mockReturnValue({ eq });
	const from = vi.fn().mockReturnValue({ select });

	const client = { from } as unknown as SupabaseClient;
	return { client, mocks: { from, select, eq, order } };
}

/** Chain ending in `.single()` after `.select().eq()` — single-row fetches. */
function makeSelectSingleStub(response: { data: unknown; error: unknown }) {
	const single = vi.fn().mockResolvedValue(response);
	const eq = vi.fn().mockReturnValue({ single });
	const select = vi.fn().mockReturnValue({ eq });
	const from = vi.fn().mockReturnValue({ select });

	const client = { from } as unknown as SupabaseClient;
	return { client, mocks: { from, select, eq, single } };
}

/** Chain ending in `.single()` after `.insert().select()` — insert+returning. */
function makeInsertStub(response: { data: unknown; error: unknown }) {
	const single = vi.fn().mockResolvedValue(response);
	const select = vi.fn().mockReturnValue({ single });
	const insert = vi.fn().mockReturnValue({ select });
	const from = vi.fn().mockReturnValue({ insert });

	const client = { from } as unknown as SupabaseClient;
	return { client, mocks: { from, insert, select, single } };
}

describe('loadClassesForInstructor', () => {
	const sample = [
		{
			id: 'c1',
			name: '초급반',
			description: null,
			instructor_id: 'inst-1',
			created_at: '2026-01-01T00:00:00Z'
		}
	];

	it('returns the list when found', async () => {
		const { client } = makeListStub({ data: sample, error: null });
		expect(await loadClassesForInstructor(client, 'inst-1')).toEqual(sample);
	});

	it('returns empty array on error', async () => {
		const { client } = makeListStub({ data: null, error: { message: 'oops' } });
		expect(await loadClassesForInstructor(client, 'inst-1')).toEqual([]);
	});

	it('queries classes filtered by instructor_id, newest first', async () => {
		const { client, mocks } = makeListStub({ data: [], error: null });
		await loadClassesForInstructor(client, 'inst-1');

		expect(mocks.from).toHaveBeenCalledWith('classes');
		expect(mocks.select).toHaveBeenCalledWith('id, name, description, instructor_id, created_at');
		expect(mocks.eq).toHaveBeenCalledWith('instructor_id', 'inst-1');
		expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
	});
});

describe('createClass', () => {
	const sample = {
		id: 'c1',
		name: '초급반',
		description: '6월반',
		instructor_id: 'inst-1',
		created_at: '2026-01-01T00:00:00Z'
	};

	it('returns the new class on success', async () => {
		const { client } = makeInsertStub({ data: sample, error: null });
		expect(await createClass(client, 'inst-1', { name: '초급반', description: '6월반' })).toEqual(
			sample
		);
	});

	it('returns null on error', async () => {
		const { client } = makeInsertStub({ data: null, error: { message: 'denied' } });
		expect(await createClass(client, 'inst-1', { name: '초급반' })).toBeNull();
	});

	it('inserts with instructor_id and provided fields', async () => {
		const { client, mocks } = makeInsertStub({ data: null, error: null });
		await createClass(client, 'inst-1', { name: '초급반', description: '6월반' });

		expect(mocks.from).toHaveBeenCalledWith('classes');
		expect(mocks.insert).toHaveBeenCalledWith({
			instructor_id: 'inst-1',
			name: '초급반',
			description: '6월반'
		});
	});

	it('defaults description to null when omitted', async () => {
		const { client, mocks } = makeInsertStub({ data: null, error: null });
		await createClass(client, 'inst-1', { name: '초급반' });

		expect(mocks.insert).toHaveBeenCalledWith({
			instructor_id: 'inst-1',
			name: '초급반',
			description: null
		});
	});
});

describe('loadClassById', () => {
	const sample = {
		id: 'c1',
		name: '초급반',
		description: null,
		instructor_id: 'inst-1',
		created_at: '2026-01-01'
	};

	it('returns the class when found', async () => {
		const { client } = makeSelectSingleStub({ data: sample, error: null });
		expect(await loadClassById(client, 'c1')).toEqual(sample);
	});

	it('returns null when not found', async () => {
		const { client } = makeSelectSingleStub({ data: null, error: null });
		expect(await loadClassById(client, 'c1')).toBeNull();
	});

	it('queries by id', async () => {
		const { client, mocks } = makeSelectSingleStub({ data: null, error: null });
		await loadClassById(client, 'c-abc');

		expect(mocks.from).toHaveBeenCalledWith('classes');
		expect(mocks.eq).toHaveBeenCalledWith('id', 'c-abc');
	});
});
