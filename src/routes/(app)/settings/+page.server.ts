import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users, push_subscriptions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { parseSlackChannelId, getSlackChannelInfo, slackErrorMessage } from '$lib/server/slack';

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
		crosspostChannelId: locals.user!.slack_crosspost_channel_id,
		crosspostChannelName: locals.user!.slack_crosspost_channel_name,
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

	saveCrosspostChannel: async ({ request, locals }) => {
		const form = await request.formData();
		const raw = ((form.get('channel') as string | null) ?? '').trim();

		// Empty input clears the configured channel.
		if (!raw) {
			await db
				.update(users)
				.set({ slack_crosspost_channel_id: null, slack_crosspost_channel_name: null })
				.where(eq(users.id, locals.user!.id));
			return { crosspost: { ok: true, cleared: true } };
		}

		const channelId = parseSlackChannelId(raw);
		if (!channelId) {
			return fail(400, {
				crosspost: {
					ok: false,
					error:
						"That doesn't look like a channel link or ID. Paste a channel link, or an ID like C0123ABC456."
				}
			});
		}

		// Confirm the channel is reachable and resolve its name for display.
		const info = await getSlackChannelInfo(channelId);
		if (!info.ok) {
			return fail(400, { crosspost: { ok: false, error: slackErrorMessage(info.error) } });
		}

		await db
			.update(users)
			.set({
				slack_crosspost_channel_id: info.id ?? channelId,
				slack_crosspost_channel_name: info.name ?? null
			})
			.where(eq(users.id, locals.user!.id));

		return { crosspost: { ok: true, name: info.name ?? null } };
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
