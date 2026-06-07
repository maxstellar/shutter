import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ ok: false }, { status: 401 });

	await db.update(users).set({ onboarded: true }).where(eq(users.id, locals.user.id));

	return json({ ok: true });
};
