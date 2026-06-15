import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { photos, daily_prompts, prompt_completions } from '$lib/server/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';

export const load: PageServerLoad = async ({ locals }) => {
	const today = currentETDay();

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
		photos: myPhotos,
		prompt: todayPrompt[0] ?? null,
		completion: myCompletion[0] ?? null,
		crosspostChannelId: locals.user!.slack_crosspost_channel_id,
		crosspostChannelName: locals.user!.slack_crosspost_channel_name
	};
};
