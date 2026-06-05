import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	await db.execute(sql`select 1`);
	return json({ ok: true, ts: new Date().toISOString() });
};
