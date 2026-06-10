<script lang="ts">
	import { navigating } from '$app/stores';

	let visible = $state(false);
	let progress = $state(0);

	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let tick: ReturnType<typeof setInterval> | undefined;

	$effect(() => {
		if ($navigating) {
			clearTimeout(showTimer);
			clearTimeout(hideTimer);
			clearInterval(tick);
			showTimer = setTimeout(() => {
				visible = true;
				progress = 0.08;
				tick = setInterval(() => {
					// asymptote toward 0.85 so the bar always looks like it's moving
					progress = progress + (0.85 - progress) * 0.12;
				}, 120);
			}, 150);
		} else {
			clearTimeout(showTimer);
			clearInterval(tick);
			if (visible) {
				progress = 1;
				hideTimer = setTimeout(() => {
					visible = false;
					progress = 0;
				}, 250);
			}
		}
	});
</script>

{#if visible}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 origin-left"
		style="background-color: var(--color-accent); transform: scaleX({progress}); transition: transform 200ms ease-out, opacity 200ms ease-out; opacity: {progress >= 1 ? 0 : 1};"
	></div>
{/if}
