import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { photos, daily_prompts, prompt_completions } from '$lib/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';
import { DEMO_DAY } from '$lib/server/demo';

export const load: PageServerLoad = async ({ locals }) => {
	// Demo users see the showcase day's prompt to match the album; their uploads
	// are local-only anyway, so the queried photos are unused for them.
	const today = locals.isDemo ? DEMO_DAY : currentETDay();

	const [myPhotos, todayPrompt, myCompletion] = await Promise.all([
		db
			.select()
			.from(photos)
			.where(
				and(eq(photos.user_id, locals.user!.id), eq(photos.day, today), isNull(photos.deleted_at))
			)
			.orderBy(photos.created_at),
		db.select().from(daily_prompts).where(eq(daily_prompts.day, today)).limit(1),
		db
			.select()
			.from(prompt_completions)
			.where(
				and(eq(prompt_completions.user_id, locals.user!.id), eq(prompt_completions.day, today))
			)
			.limit(1)
	]);

	return {
		today,
		isDemo: locals.isDemo,
		photos: myPhotos,
		prompt: todayPrompt[0] ?? null,
		completion: myCompletion[0] ?? null,
		crosspostChannelId: locals.user!.slack_crosspost_channel_id,
		crosspostChannelName: locals.user!.slack_crosspost_channel_name
	};
};
