import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { photos, users, daily_prompts, prompt_completions } from '$lib/server/db/schema';
import { and, eq, isNull, desc } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!locals.isWhitelisted) throw redirect(303, '/ineligible');

	const today = currentETDay();

	const [todayPhotos, todayPrompt, myCompletion] = await Promise.all([
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
			.where(and(eq(photos.day, today), isNull(photos.deleted_at)))
			.orderBy(desc(photos.created_at)),
		db.select().from(daily_prompts).where(eq(daily_prompts.day, today)).limit(1),
		locals.user
			? db
					.select()
					.from(prompt_completions)
					.where(
						and(
							eq(prompt_completions.user_id, locals.user.id),
							eq(prompt_completions.day, today)
						)
					)
					.limit(1)
			: Promise.resolve([])
	]);

	// Group photos by user
	const byUser = new Map<string, typeof todayPhotos>();
	for (const p of todayPhotos) {
		const key = p.user_id;
		if (!byUser.has(key)) byUser.set(key, []);
		byUser.get(key)!.push(p);
	}

	const groups = [...byUser.entries()].map(([userId, userPhotos]) => ({
		userId,
		name: userPhotos[0].user_name,
		avatarUrl: userPhotos[0].user_avatar,
		photos: userPhotos
	}));

	return {
		today,
		groups,
		prompt: todayPrompt[0] ?? null,
		myCompletion: myCompletion[0] ?? null,
		myPhotoCount: todayPhotos.filter((p) => p.user_id === locals.user!.id).length
	};
};
