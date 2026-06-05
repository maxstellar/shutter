<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	const THRESHOLD = 120;
	const CIRCUMFERENCE = 2 * Math.PI * 6;

	let pull = $state(0);
	let refreshing = $state(false);
	let done = $state(false);

	onMount(() => {
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			('standalone' in navigator && (navigator as Navigator & { standalone: boolean }).standalone);

		if (!isStandalone) return;

		let startY = 0;
		let tracking = false;
		let maxDy = 0;

		const onStart = (e: TouchEvent) => {
			if (window.scrollY <= 2) {
				startY = e.touches[0].clientY;
				maxDy = 0;
				tracking = true;
			}
		};

		const onMove = (e: TouchEvent) => {
			if (!tracking || refreshing) return;
			const dy = e.touches[0].clientY - startY;
			if (dy > maxDy) maxDy = dy;
			if (dy < -10 && maxDy < 5) {
				tracking = false;
				pull = 0;
				return;
			}
			pull = Math.max(0, Math.min(dy / THRESHOLD, 1.2));
		};

		const onEnd = () => {
			if (!tracking) return;
			tracking = false;
			if (pull >= 1) {
				pull = 0;
				refreshing = true;
				invalidateAll().then(() => {
					refreshing = false;
					done = true;
					setTimeout(() => (done = false), 900);
				});
			} else {
				pull = 0;
			}
		};

		document.addEventListener('touchstart', onStart, { passive: true });
		document.addEventListener('touchmove', onMove, { passive: true });
		document.addEventListener('touchend', onEnd);

		return () => {
			document.removeEventListener('touchstart', onStart);
			document.removeEventListener('touchmove', onMove);
			document.removeEventListener('touchend', onEnd);
		};
	});

	let visible = $derived(pull > 0 || refreshing || done);
	let translateY = $derived(refreshing || done ? 68 : pull * 110 - 20);
	let dashOffset = $derived(CIRCUMFERENCE * (1 - Math.min(pull, 1)));
</script>

{#if visible}
	<div
		class="pointer-events-none fixed top-0 left-1/2 z-50 sm:hidden"
		style="transform: translate(-50%, {translateY}px); transition: {refreshing || done ? 'transform 180ms ease-out' : 'none'}; opacity: {done ? '0' : '1'}; transition: transform 180ms ease-out, opacity 600ms ease-in {done ? '300ms' : '0ms'}"
	>
		<div class="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md dark:bg-zinc-800">
			{#if done}
				<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
					<path d="M2.5 7L5.5 10L11.5 4" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			{:else if refreshing}
				<svg width="16" height="16" viewBox="0 0 16 16" class="animate-spin">
					<circle cx="8" cy="8" r="6" fill="none" stroke="#e4e4e7" stroke-width="2" class="dark:stroke-zinc-600" />
					<circle
						cx="8" cy="8" r="6" fill="none"
						stroke="var(--color-accent)" stroke-width="2"
						stroke-dasharray={CIRCUMFERENCE}
						stroke-dashoffset={CIRCUMFERENCE * 0.75}
						stroke-linecap="round"
						transform="rotate(-90 8 8)"
					/>
				</svg>
			{:else}
				<svg width="16" height="16" viewBox="0 0 16 16">
					<circle cx="8" cy="8" r="6" fill="none" stroke="#e4e4e7" stroke-width="2" class="dark:stroke-zinc-600" />
					<circle
						cx="8" cy="8" r="6" fill="none"
						stroke="var(--color-accent)" stroke-width="2"
						stroke-dasharray={CIRCUMFERENCE}
						stroke-dashoffset={dashOffset}
						stroke-linecap="round"
						transform="rotate(-90 8 8)"
					/>
				</svg>
			{/if}
		</div>
	</div>
{/if}
