import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	// Demo users are allowed into this group so they can reach /upload; pages that
	// aren't part of the demo (streaks, settings, album/[date]) redirect them out.
	return {};
};
