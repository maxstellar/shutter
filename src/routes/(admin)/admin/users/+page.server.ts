import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, photos, push_subscriptions } from '$lib/server/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';
import { computeStreak } from '$lib/server/streak';
import { getWhitelistedSlackIds } from '$lib/server/auth/access';

export const load: PageServerLoad = async () => {
	const today = currentETDay();

	const [allUsers, whitelistedIds] = await Promise.all([
		db.select().from(users).orderBy(users.name),
		getWhitelistedSlackIds()
	]);
	const whitelisted = allUsers.filter((u) => u.slack_id && whitelistedIds.has(u.slack_id));

	const [todayCounts, pushCounts] = await Promise.all([
		db
			.select({ user_id: photos.user_id, count: sql<number>`count(*)::int` })
			.from(photos)
			.where(and(eq(photos.day, today), isNull(photos.deleted_at)))
			.groupBy(photos.user_id),
		db
			.select({ user_id: push_subscriptions.user_id, count: sql<number>`count(*)::int` })
			.from(push_subscriptions)
			.groupBy(push_subscriptions.user_id)
	]);
	const countMap = new Map(todayCounts.map((r) => [r.user_id, r.count]));
	const pushMap = new Map(pushCounts.map((r) => [r.user_id, r.count]));

	const members = await Promise.all(
		whitelisted.map(async (u) => {
			const { current } = await computeStreak(u.id);
			return {
				id: u.id,
				name: u.name,
				email: u.email,
				avatar_url: u.avatar_url,
				todayCount: countMap.get(u.id) ?? 0,
				streak: current,
				reminder_hour: u.reminder_hour_local,
				slack_notify: u.slack_notify,
				has_slack: !!u.slack_id,
				push_count: pushMap.get(u.id) ?? 0
			};
		})
	);

	members.sort((a, b) => b.streak - a.streak || a.name.localeCompare(b.name));
	return { members, today };
};
