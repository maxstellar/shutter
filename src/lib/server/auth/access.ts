import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { whitelist } from '$lib/server/db/schema';

function parseIdSet(raw: string | undefined): Set<string> {
	if (!raw) return new Set();
	return new Set(
		raw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	);
}

const ADMINS = parseIdSet(env.ADMIN_IDS);

const WHITELIST_TTL_MS = 60_000;
let cachedWhitelist: Set<string> | null = null;
let cachedAt = 0;
let pendingLoad: Promise<Set<string>> | null = null;

async function loadWhitelist(): Promise<Set<string>> {
	const rows = await db.select({ slack_id: whitelist.slack_id }).from(whitelist);
	const ids = new Set(rows.map((r) => r.slack_id));
	for (const id of ADMINS) ids.add(id);
	return ids;
}

async function getCachedWhitelist(): Promise<Set<string>> {
	const now = Date.now();
	if (cachedWhitelist && now - cachedAt < WHITELIST_TTL_MS) {
		return cachedWhitelist;
	}
	// dedupe concurrent loads
	if (!pendingLoad) {
		pendingLoad = loadWhitelist().then((set) => {
			cachedWhitelist = set;
			cachedAt = Date.now();
			pendingLoad = null;
			return set;
		});
	}
	return pendingLoad;
}

export function invalidateWhitelistCache(): void {
	cachedWhitelist = null;
	cachedAt = 0;
}

export async function isWhitelisted(slackId: string | null): Promise<boolean> {
	if (!slackId) return false;
	if (ADMINS.has(slackId)) return true;
	const set = await getCachedWhitelist();
	return set.has(slackId);
}

export function isAdmin(slackId: string | null): boolean {
	if (!slackId) return false;
	return ADMINS.has(slackId);
}

export async function getWhitelistedSlackIds(): Promise<Set<string>> {
	return getCachedWhitelist();
}

export function requireWhitelisted(event: RequestEvent): void {
	if (!event.locals.isWhitelisted) {
		error(401, 'Unauthorized');
	}
}

export function requireAdmin(event: RequestEvent): void {
	if (!event.locals.isAdmin) {
		error(404, 'Not found');
	}
}
