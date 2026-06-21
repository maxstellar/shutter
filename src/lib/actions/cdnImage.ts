/**
 * Svelte action for resilient CDN image loading.
 *
 * Gallery photos are served straight from the Hack Club CDN, which occasionally
 * drops a request (transient 5xx, connection reset, a not-yet-warm object, a
 * flaky mobile network). When that happens the browser paints its broken-image
 * "question mark" glyph AND caches the failure, so it sticks until a hard
 * reload. This action makes that impossible:
 *
 *  - on error it immediately swaps in a neutral placeholder, so the broken-image
 *    glyph is never shown to the user;
 *  - it retries the real URL with exponential backoff plus a cache-busting query
 *    param, so the browser re-requests instead of replaying the cached failure;
 *  - once the retries are exhausted the faint placeholder simply remains.
 *
 * Keep the regular `src={url}` binding on the element (SSR first-paint stays
 * intact) and add `use:cdnImage={url}` with the SAME url. The action only takes
 * over when a load fails; the bound `src` still drives the initial/normal load
 * and any reactive url changes (e.g. the lightbox stepping between photos).
 */

// Subtle, theme-agnostic translucent tile shown while retrying or after the
// retries fail. With `object-cover`/`object-contain` it renders as a flat, faint
// placeholder that reads fine on both light and dark backgrounds.
const PLACEHOLDER =
	"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='40'%20height='40'%3E%3Crect%20width='40'%20height='40'%20fill='%23a1a1aa'%20fill-opacity='0.18'/%3E%3C/svg%3E";

const MAX_RETRIES = 5;

export function cdnImage(node: HTMLImageElement, src: string) {
	let realSrc = src;
	let attempts = 0;
	let timer: ReturnType<typeof setTimeout> | undefined;

	function isPlaceholder() {
		return node.src.startsWith('data:');
	}

	function onError() {
		// The placeholder is a static data URI and cannot itself fail — ignore.
		if (isPlaceholder()) return;

		// Hide the broken-image glyph right away while we wait and retry.
		node.src = PLACEHOLDER;

		if (attempts >= MAX_RETRIES) return; // give up: leave the placeholder

		attempts += 1;
		const delay = Math.min(1000 * 2 ** (attempts - 1), 8000); // 1s,2s,4s,8s,8s
		timer = setTimeout(() => {
			const sep = realSrc.includes('?') ? '&' : '?';
			node.src = `${realSrc}${sep}retry=${attempts}`;
		}, delay);
	}

	node.addEventListener('error', onError);

	// The element may have already finished (and failed) before this action
	// attached its listener — in that case the `error` event won't fire again,
	// so detect the broken state and kick off recovery.
	if (node.complete && node.naturalWidth === 0 && node.currentSrc && !isPlaceholder()) {
		onError();
	}

	return {
		update(next: string) {
			if (next === realSrc) return;
			// The bound `src` attribute drives the actual reload; just reset our
			// retry bookkeeping so the new url gets a fresh set of attempts.
			if (timer) clearTimeout(timer);
			realSrc = next;
			attempts = 0;
		},
		destroy() {
			if (timer) clearTimeout(timer);
			node.removeEventListener('error', onError);
		}
	};
}
