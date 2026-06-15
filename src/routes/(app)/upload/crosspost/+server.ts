import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import { requireWhitelisted } from '$lib/server/auth/access';
import { db } from '$lib/server/db';
import { photos } from '$lib/server/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { sendSlackChannelImages, slackErrorMessage } from '$lib/server/slack';

export const POST: RequestHandler = async (event) => {
	requireWhitelisted(event);

	const user = event.locals.user!;
	if (!user.slack_crosspost_channel_id) error(400, 'No crosspost channel configured');

	const body = await event.request.json().catch(() => null);
	const ids: string[] = Array.isArray(body?.photoIds)
		? body.photoIds.filter((x: unknown): x is string => typeof x === 'string')
		: [];
	if (ids.length === 0) error(400, 'No photos to crosspost');

	// Re-load the photos server-side: verify ownership, that they exist and aren't deleted,
	// and pull the canonical CDN URLs (never trust client-supplied URLs). Ordered so the
	// images appear in the channel in the same order they were uploaded.
	const rows = await db
		.select({ cdn_url: photos.cdn_url })
		.from(photos)
		.where(and(inArray(photos.id, ids), eq(photos.user_id, user.id), isNull(photos.deleted_at)))
		.orderBy(photos.created_at);

	const urls = rows.map((r) => r.cdn_url);
	if (urls.length === 0) error(404, 'Photos not found');

	const result = await sendSlackChannelImages(user.slack_crosspost_channel_id, urls);
	if (!result.ok) {
		// 200 with ok:false so the client can show a toast without treating it as a hard error.
		return json({ ok: false, error: slackErrorMessage(result.error) });
	}

	return json({ ok: true, count: urls.length, channel: user.slack_crosspost_channel_name });
};
