<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';

	const STORAGE_KEY = 'shutter:mobile-nudge-dismissed';

	let visible = $state(false);

	onMount(() => {
		const isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as any).standalone === true;
		const isDesktop = window.innerWidth >= 640;
		const dismissed = !!localStorage.getItem(STORAGE_KEY);

		if (isDesktop && !isStandalone && !dismissed) {
			visible = true;
		}
	});

	function dismiss() {
		visible = false;
		localStorage.setItem(STORAGE_KEY, '1');
	}
</script>

{#if visible}
	<div
		class="fixed bottom-4 left-1/2 z-50 hidden -translate-x-1/2 items-center gap-3 rounded-xl border border-zinc-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:flex dark:border-zinc-700 dark:bg-zinc-900/95"
	>
		<p class="text-sm text-zinc-600 dark:text-zinc-300">
			📱 Shutter is better on your phone - add it to your home screen for the full experience.
		</p>
		<button
			onclick={dismiss}
			aria-label="Dismiss"
			class="flex-none text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
		>
			<X size={16} />
		</button>
	</div>
{/if}
