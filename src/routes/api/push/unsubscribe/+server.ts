import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { requireWhitelisted } from '$lib/server/auth/access';
import { db } from '$lib/server/db';
import { push_subscriptions } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async (event) => {
	requireWhitelisted(event);

	let body: { endpoint: string };
	try {
		body = await event.request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	if (!body.endpoint) error(400, 'endpoint required');

	await db
		.delete(push_subscriptions)
		.where(
			and(
				eq(push_subscriptions.endpoint, body.endpoint),
				eq(push_subscriptions.user_id, event.locals.user!.id)
			)
		);

	return json({ ok: true });
};
