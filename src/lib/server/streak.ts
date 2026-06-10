import { db } from '$lib/server/db';
import { photos, prompt_completions } from '$lib/server/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { currentETDay } from './time';

export interface StreakInfo {
	current: number;
	longest: number;
}

function ymdMinusOne(day: string): string {
	const d = new Date(day + 'T12:00:00Z');
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

function walkStreak(
	today: string,
	photoCounts: Map<string, number>,
	completions: Map<string, number>
): StreakInfo {
	let streak = 0;
	let longest = 0;
	let rejectedDay = false;

	let cursor = ymdMinusOne(today);
	while (true) {
		const count = photoCounts.get(cursor) ?? 0;
		if (count === 0) break;
		const met = completions.get(cursor);
		if (met === 0) {
			rejectedDay = true;
			break;
		}
		if (count < 3) break;
		streak++;
		longest = Math.max(longest, streak);
		cursor = ymdMinusOne(cursor);
	}

	const todayCount = photoCounts.get(today) ?? 0;
	const todayMet = completions.get(today);

	if (todayMet === 0) {
		streak = 0;
	} else if (!rejectedDay && todayCount >= 3) {
		streak++;
		longest = Math.max(longest, streak);
	}

	return { current: streak, longest };
}

// A day is "complete" if:
//   - user has >= 3 non-deleted photos
//   - AND prompt_met is NOT 0 (null = not yet reviewed = benefit of the doubt, 1 = approved)
// A day is "broken" if prompt_met = 0 (admin explicitly rejected)
// Today never breaks the streak even if incomplete, but counts toward it if >= 3 photos.
export async function computeStreaksForUsers(
	userIds: string[]
): Promise<Map<string, StreakInfo>> {
	const result = new Map<string, StreakInfo>();
	if (userIds.length === 0) return result;

	const today = currentETDay();

	const [photoRows, completionRows] = await Promise.all([
		db
			.select({
				user_id: photos.user_id,
				day: photos.day,
				count: sql<number>`count(*)::int`
			})
			.from(photos)
			.where(and(inArray(photos.user_id, userIds), isNull(photos.deleted_at)))
			.groupBy(photos.user_id, photos.day),
		db
			.select({
				user_id: prompt_completions.user_id,
				day: prompt_completions.day,
				prompt_met: prompt_completions.prompt_met
			})
			.from(prompt_completions)
			.where(inArray(prompt_completions.user_id, userIds))
	]);

	const photosByUser = new Map<string, Map<string, number>>();
	for (const row of photoRows) {
		let m = photosByUser.get(row.user_id);
		if (!m) photosByUser.set(row.user_id, (m = new Map()));
		m.set(row.day!, row.count);
	}

	const completionsByUser = new Map<string, Map<string, number>>();
	for (const row of completionRows) {
		let m = completionsByUser.get(row.user_id);
		if (!m) completionsByUser.set(row.user_id, (m = new Map()));
		m.set(row.day!, row.prompt_met);
	}

	for (const userId of userIds) {
		result.set(
			userId,
			walkStreak(
				today,
				photosByUser.get(userId) ?? new Map(),
				completionsByUser.get(userId) ?? new Map()
			)
		);
	}

	return result;
}

export async function computeStreak(userId: string): Promise<StreakInfo> {
	const map = await computeStreaksForUsers([userId]);
	return map.get(userId) ?? { current: 0, longest: 0 };
}
