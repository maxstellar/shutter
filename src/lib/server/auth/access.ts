import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

function parseIdSet(raw: string | undefined): Set<string> {
	if (!raw) return new Set();
	return new Set(
		raw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean)
	);
}

// Parsed once at module load
const WHITELIST = parseIdSet(env.WHITELIST_IDS);
const ADMINS = parseIdSet(env.ADMIN_IDS);

export function isWhitelisted(slackId: string | null): boolean {
	if (!slackId) return false;
	return WHITELIST.has(slackId) || ADMINS.has(slackId);
}

export function isAdmin(slackId: string | null): boolean {
	if (!slackId) return false;
	return ADMINS.has(slackId);
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
