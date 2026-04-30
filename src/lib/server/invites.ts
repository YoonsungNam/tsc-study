import type { SupabaseClient } from '@supabase/supabase-js';

// Confusion-free alphabet (Crockford-ish): no O/0 or I/1 to avoid the
// "is this a one or an L?" problem when an instructor reads a code aloud
// to a student. 32 characters → 32^8 ≈ 1.1 trillion combinations.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

const SELECT_COLUMNS =
	'id, code, class_id, created_by, max_uses, used_count, expires_at, created_at';

export type InviteRow = {
	id: string;
	code: string;
	class_id: string;
	created_by: string;
	max_uses: number | null;
	used_count: number;
	expires_at: string | null;
	created_at: string;
};

/**
 * Generate a random 8-char invite code from the confusion-free alphabet.
 * Uses `crypto.getRandomValues` for cryptographic-quality entropy
 * (globally available in Node 19+; we're on 22).
 *
 * Collision risk: at 32^8 ≈ 1.1 trillion combinations and our scale
 * (handful of instructors, modest invite volume), birthday-paradox
 * collisions are vanishing-small. The unique constraint on
 * `invites.code` guards against the once-in-a-lifetime case — callers
 * can retry on insert failure.
 */
export function generateInviteCode(): string {
	const buf = new Uint8Array(CODE_LENGTH);
	crypto.getRandomValues(buf);
	let code = '';
	for (let i = 0; i < CODE_LENGTH; i++) {
		code += ALPHABET[buf[i] % ALPHABET.length];
	}
	return code;
}

/**
 * Create an invite for a class. Defaults: unlimited uses, no expiry.
 * Returns the new row (so callers can show its code) or null on failure.
 *
 * RLS: the `invites: instructor manage` policy in 001_initial.sql
 * enforces that `created_by` matches `auth.uid()`.
 */
export async function createInvite(
	supabase: SupabaseClient,
	args: {
		classId: string;
		instructorId: string;
		maxUses?: number | null;
		expiresAt?: string | null;
	}
): Promise<InviteRow | null> {
	const { data, error } = await supabase
		.from('invites')
		.insert({
			code: generateInviteCode(),
			class_id: args.classId,
			created_by: args.instructorId,
			max_uses: args.maxUses ?? null,
			expires_at: args.expiresAt ?? null
		})
		.select(SELECT_COLUMNS)
		.single();

	if (error || !data) return null;
	return data as InviteRow;
}

/**
 * List invites for a class, newest first. RLS limits this to the
 * instructor who owns the class.
 */
export async function loadInvitesForClass(
	supabase: SupabaseClient,
	classId: string
): Promise<InviteRow[]> {
	const { data, error } = await supabase
		.from('invites')
		.select(SELECT_COLUMNS)
		.eq('class_id', classId)
		.order('created_at', { ascending: false });

	if (error || !data) return [];
	return data as InviteRow[];
}

export type InvitePreview = {
	class_name: string;
	instructor_name: string;
	valid: boolean;
};

/**
 * Public-facing preview for an invite code: class name + instructor
 * display name + whether the invite is still usable. Backed by the
 * `get_invite_preview` SECURITY DEFINER RPC (migration 003), since RLS
 * otherwise hides invites from anyone other than the creator.
 *
 * Returns null when the code doesn't exist.
 */
export async function getInvitePreview(
	supabase: SupabaseClient,
	code: string
): Promise<InvitePreview | null> {
	const { data, error } = await supabase.rpc('get_invite_preview', {
		invite_code: code
	});

	if (error || !data || (Array.isArray(data) && data.length === 0)) {
		return null;
	}
	return (Array.isArray(data) ? data[0] : data) as InvitePreview;
}

/**
 * Call the `redeem_invite` SECURITY DEFINER RPC (defined in 001) to
 * create the caller's membership in the invite's class. Returns either
 * the joined class_id or an error message.
 *
 * The RPC handles its own validity checks (expired, used-up, missing,
 * unauthenticated) and raises plpgsql exceptions which Supabase surfaces
 * as `error.message` here.
 */
export async function redeemInvite(
	supabase: SupabaseClient,
	code: string
): Promise<{ classId: string } | { error: string }> {
	const { data, error } = await supabase.rpc('redeem_invite', {
		invite_code: code
	});

	if (error) {
		return { error: error.message };
	}
	return { classId: data as string };
}
