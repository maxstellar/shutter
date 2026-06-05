import webpush from 'web-push';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { push_subscriptions } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

let configured = false;

function ensureConfigured() {
	if (configured) return;
	if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
		throw new Error('VAPID env vars are not set');
	}
	webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
	configured = true;
}

export interface PushPayload {
	title: string;
	body: string;
	url: string;
}

export async function sendPushNotification(
	subscriptionId: string,
	endpoint: string,
	p256dh: string,
	auth: string,
	payload: PushPayload
): Promise<void> {
	ensureConfigured();
	try {
		await webpush.sendNotification(
			{ endpoint, keys: { p256dh, auth } },
			JSON.stringify(payload),
			{ TTL: 86400 }
		);
	} catch (err: unknown) {
		const status = (err as { statusCode?: number }).statusCode;
		if (status === 404 || status === 410) {
			// Subscription is dead — remove it
			await db.delete(push_subscriptions).where(eq(push_subscriptions.id, subscriptionId));
			return;
		}
		// Increment failure count for transient errors
		await db
			.update(push_subscriptions)
			.set({ failure_count: sql`${push_subscriptions.failure_count} + 1` })
			.where(eq(push_subscriptions.id, subscriptionId));
		console.error(`Push send failed for subscription ${subscriptionId}:`, err);
	}
}
