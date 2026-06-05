import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { requireWhitelisted } from '$lib/server/auth/access';
import { db } from '$lib/server/db';
import { push_subscriptions } from '$lib/server/db/schema';

export const POST: RequestHandler = async (event) => {
	requireWhitelisted(event);

	let body: { endpoint: string; keys: { p256dh: string; auth: string } };
	try {
		body = await event.request.json();
	} catch {
		error(400, 'Invalid JSON');
	}

	const { endpoint, keys } = body;
	if (!endpoint || !keys?.p256dh || !keys?.auth) {
		error(400, 'Invalid subscription object');
	}

	const ua = event.request.headers.get('user-agent');
	const userId = event.locals.user!.id;

	await db
		.insert(push_subscriptions)
		.values({
			user_id: userId,
			endpoint,
			p256dh: keys.p256dh,
			auth: keys.auth,
			user_agent: ua
		})
		.onConflictDoUpdate({
			target: push_subscriptions.endpoint,
			set: { p256dh: keys.p256dh, auth: keys.auth, failure_count: 0 }
		});

	return json({ ok: true });
};
