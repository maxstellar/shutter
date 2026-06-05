import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/auth/access';
import { db } from '$lib/server/db';
import { daily_prompts, audit_log } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';
import { currentETDay } from '$lib/server/time';

export const load: PageServerLoad = async () => {
	const prompts = await db.select().from(daily_prompts).orderBy(desc(daily_prompts.day)).limit(30);
	return { prompts, today: currentETDay() };
};

export const actions: Actions = {
	default: async (event) => {
		requireAdmin(event);
		const form = await event.request.formData();
		const day = form.get('day') as string;
		const text = (form.get('text') as string)?.trim();

		if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return fail(400, { error: 'Invalid date' });
		if (!text) return fail(400, { error: 'Prompt text is required' });

		await db
			.insert(daily_prompts)
			.values({ day, text, set_by_user_id: event.locals.user!.id })
			.onConflictDoUpdate({
				target: daily_prompts.day,
				set: { text, set_by_user_id: event.locals.user!.id, updated_at: new Date() }
			});

		await db.insert(audit_log).values({
			actor_user_id: event.locals.user!.id,
			action: 'set_prompt',
			day,
			meta: { text }
		});

		return { ok: true };
	}
};
