import { db } from '$lib/server/db';
import { photos, prompt_completions } from '$lib/server/db/schema';
import { and, eq, isNull, lt } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { currentETDay } from './time';

export interface StreakInfo {
	current: number;
	longest: number;
}

// A day is "complete" if:
//   - user has >= 3 non-deleted photos
//   - AND prompt_met is NOT 0 (null = not yet reviewed = benefit of the doubt, 1 = approved)
// A day is "broken" if prompt_met = 0 (admin explicitly rejected)
// Today never breaks the streak even if incomplete, but counts toward it if >= 3 photos.
export async function computeStreak(userId: string): Promise<StreakInfo> {
	const today = currentETDay();

	// Fetch up to 365 past days of photo counts (excluding today)
	const photoCounts = await db
		.select({
			day: photos.day,
			count: sql<number>`count(*)::int`
		})
		.from(photos)
		.where(
			and(
				eq(photos.user_id, userId),
				isNull(photos.deleted_at),
				lt(photos.day, today)
			)
		)
		.groupBy(photos.day)
		.orderBy(sql`${photos.day} desc`)
		.limit(365);

	// Fetch prompt completions for those same days
	const completions = await db
		.select({ day: prompt_completions.day, prompt_met: prompt_completions.prompt_met })
		.from(prompt_completions)
		.where(
			and(
				eq(prompt_completions.user_id, userId),
				lt(prompt_completions.day, today)
			)
		);

	const completionMap = new Map(completions.map((c) => [c.day, c.prompt_met]));

	// Walk consecutive days back from yesterday
	let streak = 0;
	let longest = 0;
	let rejectedDay = false;
	let expectedDate = new Date(today);
	expectedDate.setDate(expectedDate.getDate() - 1);

	for (const row of photoCounts) {
		const rowDate = new Date(row.day!);
		// Gap in days — streak broken
		if (rowDate.getTime() !== expectedDate.getTime()) break;

		const met = completionMap.get(row.day!);
		// prompt_met = 0 means admin explicitly rejected → breaks streak
		if (met === 0) { rejectedDay = true; break; }
		if (row.count < 3) break;

		streak++;
		longest = Math.max(longest, streak);
		expectedDate.setDate(expectedDate.getDate() - 1);
	}

	// Today contributes to current streak if >= 3 photos and not explicitly rejected
	const [todayPhotos] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(photos)
		.where(and(eq(photos.user_id, userId), isNull(photos.deleted_at), eq(photos.day, today)));

	const [todayCompletion] = await db
		.select({ prompt_met: prompt_completions.prompt_met })
		.from(prompt_completions)
		.where(and(eq(prompt_completions.user_id, userId), eq(prompt_completions.day, today)))
		.limit(1);

	const todayCount = todayPhotos?.count ?? 0;
	const todayMet = todayCompletion?.prompt_met;

	if (todayMet === 0) {
		// Today explicitly rejected — current streak resets to 0
		streak = 0;
	} else if (!rejectedDay && todayCount >= 3) {
		streak++;
		longest = Math.max(longest, streak);
	}

	return { current: streak, longest };
}
