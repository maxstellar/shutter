import { env } from '$env/dynamic/private';

const SLACK_API = 'https://slack.com/api';

export async function sendSlackDM(slackId: string, text: string): Promise<boolean> {
	if (!env.SLACK_BOT_TOKEN || !slackId) return false;
	try {
		const res = await fetch('https://slack.com/api/chat.postMessage', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ channel: slackId, text })
		});
		const data = await res.json();
		if (!data.ok) console.warn('[slack] chat.postMessage failed:', data.error);
		return data.ok === true;
	} catch (e) {
		console.warn('[slack] DM send error:', e);
		return false;
	}
}

export async function fetchSlackAvatar(slackId: string): Promise<string | null> {
	if (!env.SLACK_BOT_TOKEN || !slackId) return null;
	try {
		const res = await fetch(
			`https://slack.com/api/users.info?user=${encodeURIComponent(slackId)}`,
			{
				headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` }
			}
		);
		const data = await res.json();
		if (!data.ok) return null;
		const profile = data.user?.profile;
		return profile?.image_512 ?? profile?.image_192 ?? profile?.image_72 ?? null;
	} catch (e) {
		console.warn('[slack] avatar fetch error:', e);
		return null;
	}
}

export interface SlackChannelInfo {
	ok: boolean;
	id?: string;
	name?: string;
	error?: string;
}

/**
 * Extract a Slack channel ID from a raw ID or a channel link.
 * Accepts forms like:
 *   C0123ABC456
 *   #C0123ABC456
 *   https://hackclub.slack.com/archives/C0123ABC456
 *   https://app.slack.com/client/T0123/C0123ABC456
 * Returns the uppercased channel ID, or null if nothing channel-like is found.
 */
export function parseSlackChannelId(input: string): string | null {
	const trimmed = input.trim();
	if (!trimmed) return null;
	// Channel link (archives/... or client/TEAM/...)
	const linkMatch = trimmed.match(/\/(?:archives|client\/[A-Z0-9]+)\/([CG][A-Z0-9]{6,})/i);
	if (linkMatch) return linkMatch[1].toUpperCase();
	// Raw ID, optionally prefixed with '#'
	const idMatch = trimmed.replace(/^#/, '').match(/^([CG][A-Z0-9]{6,})$/i);
	if (idMatch) return idMatch[1].toUpperCase();
	return null;
}

/** Look up a channel to confirm it exists/is reachable and to grab its name for display. */
export async function getSlackChannelInfo(channelId: string): Promise<SlackChannelInfo> {
	if (!env.SLACK_BOT_TOKEN) return { ok: false, error: 'slack_not_configured' };
	try {
		const res = await fetch(
			`${SLACK_API}/conversations.info?channel=${encodeURIComponent(channelId)}`,
			{ headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` } }
		);
		const data = await res.json();
		if (!data.ok) return { ok: false, error: data.error ?? 'unknown_error' };
		return { ok: true, id: data.channel?.id ?? channelId, name: data.channel?.name };
	} catch (e) {
		console.warn('[slack] conversations.info error:', e);
		return { ok: false, error: 'network_error' };
	}
}

export interface SlackSendResult {
	ok: boolean;
	error?: string;
}

/** Post a message made up purely of image blocks (one per URL) to a channel. */
export async function sendSlackChannelImages(
	channelId: string,
	imageUrls: string[],
	altText = 'Shutter photo'
): Promise<SlackSendResult> {
	if (!env.SLACK_BOT_TOKEN) return { ok: false, error: 'slack_not_configured' };
	if (!channelId || imageUrls.length === 0) return { ok: false, error: 'nothing_to_send' };

	// Slack caps blocks at 50/message; we never send more than 5, but guard anyway.
	const blocks = imageUrls.slice(0, 10).map((url) => ({
		type: 'image',
		image_url: url,
		alt_text: altText
	}));

	try {
		const res = await fetch(`${SLACK_API}/chat.postMessage`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.SLACK_BOT_TOKEN}`,
				'Content-Type': 'application/json'
			},
			// `text` is a notification/accessibility fallback only — it is not rendered
			// in the channel when `blocks` are present, so the message stays images-only.
			body: JSON.stringify({
				channel: channelId,
				text: imageUrls.length > 1 ? `${imageUrls.length} new photos` : 'New photo',
				blocks,
				unfurl_links: false,
				unfurl_media: false
			})
		});
		const data = await res.json();
		if (!data.ok) {
			console.warn('[slack] chat.postMessage (images) failed:', data.error);
			return { ok: false, error: data.error ?? 'unknown_error' };
		}
		return { ok: true };
	} catch (e) {
		console.warn('[slack] image send error:', e);
		return { ok: false, error: 'network_error' };
	}
}

/** Map a Slack API error code to a friendly, user-facing message for toasts/forms. */
export function slackErrorMessage(error: string | undefined): string {
	switch (error) {
		case 'not_in_channel':
		case 'channel_not_found':
			return "The Shutter bot isn't in that channel. Invite it to the channel, or pick another one in Settings.";
		case 'is_archived':
			return 'That channel is archived, so messages can’t be posted there.';
		case 'restricted_action':
		case 'cant_post_message':
			return "The bot isn't allowed to post in that channel.";
		case 'slack_not_configured':
			return 'Slack isn’t configured on the server right now.';
		case 'network_error':
			return "Couldn't reach Slack. Please try again.";
		case 'nothing_to_send':
			return 'There were no photos to send.';
		default:
			return `Couldn't post to Slack${error ? ` (${error})` : ''}.`;
	}
}
