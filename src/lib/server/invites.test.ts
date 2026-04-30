import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
	createInvite,
	generateInviteCode,
	getInvitePreview,
	loadInvitesForClass,
	redeemInvite
} from './invites';

const ALPHABET_RE = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;

describe('generateInviteCode', () => {
	it('returns an 8-character string', () => {
		expect(generateInviteCode()).toHaveLength(8);
	});

	it('uses only the confusion-free alphabet (no O/0/I/1)', () => {
		for (let i = 0; i < 100; i++) {
			const code = generateInviteCode();
			expect(code).toMatch(ALPHABET_RE);
		}
	});

	it('avoids the four confusable characters', () => {
		for (let i = 0; i < 200; i++) {
			expect(generateInviteCode()).not.toMatch(/[O0I1]/);
		}
	});

	it('generates distinct codes on subsequent calls', () => {
		// 50 draws from 32^8 ≈ 1.1T should never collide in practice.
		const codes = new Set<string>();
		for (let i = 0; i < 50; i++) {
			codes.add(generateInviteCode());
		}
		expect(codes.size).toBe(50);
	});
});

// Smoke-test stubs for the Supabase wrappers — same shape as classes.test.

function makeListStub(response: { data: unknown; error: unknown }) {
	const order = vi.fn().mockResolvedValue(response);
	const eq = vi.fn().mockReturnValue({ order });
	const select = vi.fn().mockReturnValue({ eq });
	const from = vi.fn().mockReturnValue({ select });
	const client = { from } as unknown as SupabaseClient;
	return { client, mocks: { from, select, eq, order } };
}

function makeInsertStub(response: { data: unknown; error: unknown }) {
	const single = vi.fn().mockResolvedValue(response);
	const select = vi.fn().mockReturnValue({ single });
	const insert = vi.fn().mockReturnValue({ select });
	const from = vi.fn().mockReturnValue({ insert });
	const client = { from } as unknown as SupabaseClient;
	return { client, mocks: { from, insert, select, single } };
}

describe('createInvite', () => {
	const sample = {
		id: 'i1',
		code: 'ABCDEFGH',
		class_id: 'c1',
		created_by: 'inst-1',
		max_uses: null,
		used_count: 0,
		expires_at: null,
		created_at: '2026-01-01T00:00:00Z'
	};

	it('returns the new invite on success', async () => {
		const { client } = makeInsertStub({ data: sample, error: null });
		expect(await createInvite(client, { classId: 'c1', instructorId: 'inst-1' })).toEqual(sample);
	});

	it('returns null on error', async () => {
		const { client } = makeInsertStub({ data: null, error: { message: 'denied' } });
		expect(await createInvite(client, { classId: 'c1', instructorId: 'inst-1' })).toBeNull();
	});

	it('inserts with class_id, created_by, a fresh code, and null defaults', async () => {
		const { client, mocks } = makeInsertStub({ data: null, error: null });
		await createInvite(client, { classId: 'c1', instructorId: 'inst-1' });

		expect(mocks.from).toHaveBeenCalledWith('invites');
		const inserted = mocks.insert.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(inserted.class_id).toBe('c1');
		expect(inserted.created_by).toBe('inst-1');
		expect(inserted.code).toMatch(ALPHABET_RE);
		expect((inserted.code as string).length).toBe(8);
		expect(inserted.max_uses).toBeNull();
		expect(inserted.expires_at).toBeNull();
	});

	it('honors maxUses and expiresAt overrides', async () => {
		const { client, mocks } = makeInsertStub({ data: null, error: null });
		await createInvite(client, {
			classId: 'c1',
			instructorId: 'inst-1',
			maxUses: 5,
			expiresAt: '2027-01-01T00:00:00Z'
		});

		const inserted = mocks.insert.mock.calls[0]?.[0] as Record<string, unknown>;
		expect(inserted.max_uses).toBe(5);
		expect(inserted.expires_at).toBe('2027-01-01T00:00:00Z');
	});
});

describe('loadInvitesForClass', () => {
	const sample = [
		{
			id: 'i1',
			code: 'ABCDEFGH',
			class_id: 'c1',
			created_by: 'inst-1',
			max_uses: null,
			used_count: 0,
			expires_at: null,
			created_at: '2026-01-01T00:00:00Z'
		}
	];

	it('returns the list when found', async () => {
		const { client } = makeListStub({ data: sample, error: null });
		expect(await loadInvitesForClass(client, 'c1')).toEqual(sample);
	});

	it('returns empty on error', async () => {
		const { client } = makeListStub({ data: null, error: { message: 'denied' } });
		expect(await loadInvitesForClass(client, 'c1')).toEqual([]);
	});

	it('queries invites filtered by class_id, newest first', async () => {
		const { client, mocks } = makeListStub({ data: [], error: null });
		await loadInvitesForClass(client, 'c-abc');

		expect(mocks.from).toHaveBeenCalledWith('invites');
		expect(mocks.eq).toHaveBeenCalledWith('class_id', 'c-abc');
		expect(mocks.order).toHaveBeenCalledWith('created_at', { ascending: false });
	});
});

// RPC-style stubs for getInvitePreview / redeemInvite.
function makeRpcStub(response: { data: unknown; error: unknown }) {
	const rpc = vi.fn().mockResolvedValue(response);
	const client = { rpc } as unknown as SupabaseClient;
	return { client, mocks: { rpc } };
}

describe('getInvitePreview', () => {
	const row = { class_name: '초급반', instructor_name: '김선생', valid: true };

	it('returns the first row when found', async () => {
		const { client } = makeRpcStub({ data: [row], error: null });
		expect(await getInvitePreview(client, 'ABCDEFGH')).toEqual(row);
	});

	it('also accepts a single-object response (defensive)', async () => {
		const { client } = makeRpcStub({ data: row, error: null });
		expect(await getInvitePreview(client, 'ABCDEFGH')).toEqual(row);
	});

	it('returns null when the result is empty', async () => {
		const { client } = makeRpcStub({ data: [], error: null });
		expect(await getInvitePreview(client, 'ABCDEFGH')).toBeNull();
	});

	it('returns null on rpc error', async () => {
		const { client } = makeRpcStub({ data: null, error: { message: 'rpc fail' } });
		expect(await getInvitePreview(client, 'ABCDEFGH')).toBeNull();
	});

	it('calls get_invite_preview with the code', async () => {
		const { client, mocks } = makeRpcStub({ data: [], error: null });
		await getInvitePreview(client, 'ABCDEFGH');

		expect(mocks.rpc).toHaveBeenCalledWith('get_invite_preview', {
			invite_code: 'ABCDEFGH'
		});
	});
});

describe('redeemInvite', () => {
	it('returns classId on success', async () => {
		const { client } = makeRpcStub({ data: 'class-uuid-1', error: null });
		expect(await redeemInvite(client, 'ABCDEFGH')).toEqual({ classId: 'class-uuid-1' });
	});

	it('returns the error message on failure', async () => {
		const { client } = makeRpcStub({
			data: null,
			error: { message: 'Invalid invite code' }
		});
		expect(await redeemInvite(client, 'ABCDEFGH')).toEqual({ error: 'Invalid invite code' });
	});

	it('calls redeem_invite with the code', async () => {
		const { client, mocks } = makeRpcStub({ data: 'class-uuid', error: null });
		await redeemInvite(client, 'ABCDEFGH');

		expect(mocks.rpc).toHaveBeenCalledWith('redeem_invite', {
			invite_code: 'ABCDEFGH'
		});
	});
});
