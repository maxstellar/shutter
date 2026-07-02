import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { computeStreaksForUsers } from '$lib/server/streak';
import { getWhitelistedSlackIds } from '$lib/server/auth/access';

export const load: PageServerLoad = async ({ locals }) => {
	// Leaderboard is not part of the demo.
	if (locals.isDemo) throw redirect(303, '/');

	const [allUsers, whitelistedIds] = await Promise.all([
		db.select({ id: users.id, name: users.name, avatar_url: users.avatar_url, slack_id: users.slack_id }).from(users),
		getWhitelistedSlackIds()
	]);
	const whitelisted = allUsers.filter((u) => u.slack_id && whitelistedIds.has(u.slack_id));

	const streakMap = await computeStreaksForUsers(whitelisted.map((u) => u.id));

	const streaks = whitelisted.map((u) => ({
		...u,
		...(streakMap.get(u.id) ?? { current: 0, longest: 0 })
	}));

	streaks.sort((a, b) => b.current - a.current || a.name.localeCompare(b.name));

	const mine = streaks.find((s) => s.id === locals.user!.id);

	return { streaks, myStreak: mine ?? null };
};
