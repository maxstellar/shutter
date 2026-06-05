import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, photos } from '$lib/server/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';
import { computeStreak } from '$lib/server/streak';
import { isWhitelisted } from '$lib/server/auth/access';

export const load: PageServerLoad = async () => {
	const today = currentETDay();

	const allUsers = await db.select().from(users).orderBy(users.name);
	const whitelisted = allUsers.filter((u) => isWhitelisted(u.slack_id));

	const todayCounts = await db
		.select({ user_id: photos.user_id, count: sql<number>`count(*)::int` })
		.from(photos)
		.where(and(eq(photos.day, today), isNull(photos.deleted_at)))
		.groupBy(photos.user_id);
	const countMap = new Map(todayCounts.map((r) => [r.user_id, r.count]));

	const members = await Promise.all(
		whitelisted.map(async (u) => {
			const { current } = await computeStreak(u.id);
			return {
				id: u.id,
				name: u.name,
				email: u.email,
				avatar_url: u.avatar_url,
				last_seen_at: u.last_seen_at,
				todayCount: countMap.get(u.id) ?? 0,
				streak: current
			};
		})
	);

	members.sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name));
	return { members, today };
};
