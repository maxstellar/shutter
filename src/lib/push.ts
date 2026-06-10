function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const raw = atob(base64);
	const arr = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
	return arr.buffer;
}

export async function enablePushSubscription(
	vapidPublicKey: string
): Promise<{ ok: boolean; error?: string }> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		return { ok: false, error: 'Push not supported on this device.' };
	}
	if (!vapidPublicKey) {
		return { ok: false, error: 'Missing VAPID public key.' };
	}
	try {
		const permission = await Notification.requestPermission();
		if (permission !== 'granted') {
			return { ok: false, error: 'Notification permission denied.' };
		}
		const reg = await navigator.serviceWorker.ready;
		const sub = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
		});
		const res = await fetch('/api/push/subscribe', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(sub.toJSON())
		});
		if (!res.ok) throw new Error('Subscription save failed');
		return { ok: true };
	} catch (e) {
		return { ok: false, error: e instanceof Error ? e.message : 'Failed to enable push' };
	}
}
