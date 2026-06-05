import { createHash, randomBytes } from 'crypto';
import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq, lt } from 'drizzle-orm';
import type { RequestEvent } from '@sveltejs/kit';

const COOKIE_NAME = 'session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function hashToken(raw: string): string {
	return createHash('sha256').update(raw).digest('hex');
}

function cookieOpts(maxAge: number) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		maxAge
	};
}

export async function createSession(
	userId: string,
	userAgent: string | null,
	event: RequestEvent
): Promise<void> {
	const raw = randomBytes(32).toString('hex');
	const id = hashToken(raw);
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

	await db.insert(sessions).values({ id, user_id: userId, expires_at: expiresAt, user_agent: userAgent });

	event.cookies.set(COOKIE_NAME, raw, cookieOpts(SESSION_MAX_AGE_MS / 1000));
}

export async function loadSession(event: RequestEvent) {
	const raw = event.cookies.get(COOKIE_NAME);
	if (!raw) return null;

	const id = hashToken(raw);
	const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
	if (!row) return null;

	if (row.expires_at < new Date()) {
		await db.delete(sessions).where(eq(sessions.id, id));
		event.cookies.delete(COOKIE_NAME, { path: '/' });
		return null;
	}

	// Sliding expiry — bump last_seen_at and expires_at
	const newExpiry = new Date(Date.now() + SESSION_MAX_AGE_MS);
	await db
		.update(sessions)
		.set({ last_seen_at: new Date(), expires_at: newExpiry })
		.where(eq(sessions.id, id));

	event.cookies.set(COOKIE_NAME, raw, cookieOpts(SESSION_MAX_AGE_MS / 1000));

	return row;
}

export async function deleteSession(event: RequestEvent): Promise<void> {
	const raw = event.cookies.get(COOKIE_NAME);
	if (!raw) return;
	const id = hashToken(raw);
	await db.delete(sessions).where(eq(sessions.id, id));
	event.cookies.delete(COOKIE_NAME, { path: '/' });
}

// Sweep expired sessions — call from cron or periodically
export async function sweepExpiredSessions(): Promise<void> {
	await db.delete(sessions).where(lt(sessions.expires_at, new Date()));
}
