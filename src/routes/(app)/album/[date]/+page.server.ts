import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { photos, users, daily_prompts, prompt_completions } from '$lib/server/db/schema';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params }) => {
	const { date } = params;

	// Validate date format
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw redirect(303, '/');

	const today = currentETDay();
	if (date > today) throw redirect(303, '/');
	if (env.COHORT_START && date < env.COHORT_START) throw redirect(303, '/');
	if (env.COHORT_END && date > env.COHORT_END) throw redirect(303, '/');
	if (date === today) {
		// Redirect to home handled in the page
	}

	const [dayPhotos, dayPrompt] = await Promise.all([
		db
			.select({
				id: photos.id,
				cdn_url: photos.cdn_url,
				width: photos.width,
				height: photos.height,
				created_at: photos.created_at,
				user_id: photos.user_id,
				user_name: users.name,
				user_avatar: users.avatar_url
			})
			.from(photos)
			.innerJoin(users, eq(photos.user_id, users.id))
			.where(and(eq(photos.day, date), isNull(photos.deleted_at)))
			.orderBy(desc(photos.created_at)),
		db.select().from(daily_prompts).where(eq(daily_prompts.day, date)).limit(1)
	]);

	const byUser = new Map<string, typeof dayPhotos>();
	for (const p of dayPhotos) {
		if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
		byUser.get(p.user_id)!.push(p);
	}

	const groups = [...byUser.entries()].map(([userId, userPhotos]) => ({
		userId,
		name: userPhotos[0].user_name,
		avatarUrl: userPhotos[0].user_avatar,
		photos: userPhotos
	}));

	return { date, today, groups, prompt: dayPrompt[0] ?? null };
};
