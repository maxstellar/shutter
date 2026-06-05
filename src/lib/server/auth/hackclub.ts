import { env } from '$env/dynamic/private';

const BASE = 'https://auth.hackclub.com';

export interface HackClubUser {
	id: string;
	name: string;
	email: string;
	avatar: string;
	slack_id: string | null;
}

export function getAuthorizeUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: env.HACKCLUB_AUTH_CLIENT_ID ?? '',
		redirect_uri: env.HACKCLUB_AUTH_REDIRECT_URI ?? '',
		response_type: 'code',
		scope: 'openid name profile slack_id',
		state
	});
	return `${BASE}/oauth/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{ accessToken: string; tokenData: Record<string, unknown> }> {
	const res = await fetch(`${BASE}/oauth/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: env.HACKCLUB_AUTH_CLIENT_ID ?? '',
			client_secret: env.HACKCLUB_AUTH_CLIENT_SECRET ?? '',
			redirect_uri: env.HACKCLUB_AUTH_REDIRECT_URI ?? '',
			code
		})
	});
	const tokenData = await res.json();
	if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
	return { accessToken: tokenData.access_token as string, tokenData };
}

export async function fetchHackClubUser(accessToken: string): Promise<HackClubUser> {
	const res = await fetch(`${BASE}/oauth/userinfo`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`Userinfo fetch failed: ${res.status}`);
	const data = JSON.parse(text);
	const slack_id = data.slack_id ?? data['https://hackclub.com/slack_id'] ?? null;
	return {
		id: data.sub,
		name: data.name ?? data.nickname ?? data.email,
		email: data.email ?? '',
		avatar: data.picture ?? '',
		slack_id
	};
}
