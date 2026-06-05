import { env } from '$env/dynamic/private';

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
		const res = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(slackId)}`, {
			headers: { Authorization: `Bearer ${env.SLACK_BOT_TOKEN}` }
		});
		const data = await res.json();
		if (!data.ok) return null;
		const profile = data.user?.profile;
		return profile?.image_512 ?? profile?.image_192 ?? profile?.image_72 ?? null;
	} catch (e) {
		console.warn('[slack] avatar fetch error:', e);
		return null;
	}
}
