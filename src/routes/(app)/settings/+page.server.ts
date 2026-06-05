import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, push_subscriptions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	const subs = await db
		.select({ id: push_subscriptions.id, endpoint: push_subscriptions.endpoint })
		.from(push_subscriptions)
		.where(eq(push_subscriptions.user_id, locals.user!.id));

	const theme = cookies.get('theme') ?? null;

	return {
		reminderHour: locals.user!.reminder_hour_local,
		subscriptionCount: subs.length,
		slackNotify: locals.user!.slack_notify,
		hasSlack: !!locals.user!.slack_id,
		theme,
		vapidPublicKey: env.VAPID_PUBLIC_KEY ?? ''
	};
};

export const actions: Actions = {
	saveReminder: async ({ request, locals }) => {
		const form = await request.formData();
		const hour = form.get('hour');
		const hourNum = hour === '' || hour === null ? null : parseInt(hour as string, 10);

		if (hourNum !== null && (isNaN(hourNum) || hourNum < 0 || hourNum > 23)) {
			return fail(400, { error: 'Invalid hour' });
		}

		await db
			.update(users)
			.set({ reminder_hour_local: hourNum })
			.where(eq(users.id, locals.user!.id));

		return { ok: true };
	},

	saveSlackNotify: async ({ request, locals }) => {
		const form = await request.formData();
		const enabled = form.get('enabled') === '1';
		await db.update(users).set({ slack_notify: enabled }).where(eq(users.id, locals.user!.id));
		return { ok: true };
	},

	saveTheme: async ({ request, cookies }) => {
		const form = await request.formData();
		const theme = form.get('theme');
		if (theme !== 'light' && theme !== 'dark') return fail(400, { error: 'Invalid theme' });
		cookies.set('theme', theme, {
			path: '/',
			maxAge: 365 * 24 * 60 * 60,
			sameSite: 'lax',
			httpOnly: false
		});
		return { ok: true };
	}
};
