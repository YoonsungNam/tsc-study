import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Minimal class row shape used by the instructor dashboard.
 * Matches the columns we actually read — full row typing comes when
 * `supabase gen types typescript` lands.
 *
 * `instructor_id` is selected so server callers can perform ownership
 * checks (defense-in-depth alongside RLS — see /instructor/class/[id]).
 */
export type ClassRow = {
	id: string;
	name: string;
	description: string | null;
	instructor_id: string;
	created_at: string;
};

const SELECT_COLUMNS = 'id, name, description, instructor_id, created_at';

/**
 * List the classes owned by `instructorId`, newest first.
 * Returns an empty array on RLS denial / error rather than throwing —
 * loaders should treat "no classes" the same as "empty list".
 */
export async function loadClassesForInstructor(
	supabase: SupabaseClient,
	instructorId: string
): Promise<ClassRow[]> {
	const { data, error } = await supabase
		.from('classes')
		.select(SELECT_COLUMNS)
		.eq('instructor_id', instructorId)
		.order('created_at', { ascending: false });

	if (error || !data) return [];
	return data as ClassRow[];
}

/**
 * Create a class owned by `instructorId`. Returns the new row (so callers
 * can redirect to its detail page) or null on insert failure.
 */
export async function createClass(
	supabase: SupabaseClient,
	instructorId: string,
	input: { name: string; description?: string | null }
): Promise<ClassRow | null> {
	const { data, error } = await supabase
		.from('classes')
		.insert({
			instructor_id: instructorId,
			name: input.name,
			description: input.description ?? null
		})
		.select(SELECT_COLUMNS)
		.single();

	if (error || !data) return null;
	return data as ClassRow;
}

/**
 * Fetch one class by id. Callers should still verify
 * `result.instructor_id === user.id` before treating the row as
 * owner-only — the classes RLS policy lets through both owners and
 * class members for SELECT.
 */
export async function loadClassById(
	supabase: SupabaseClient,
	classId: string
): Promise<ClassRow | null> {
	const { data, error } = await supabase
		.from('classes')
		.select(SELECT_COLUMNS)
		.eq('id', classId)
		.single();

	if (error || !data) return null;
	return data as ClassRow;
}
