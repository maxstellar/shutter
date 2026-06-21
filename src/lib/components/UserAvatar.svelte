<script lang="ts">
	let {
		name,
		avatarUrl,
		size = 32
	}: { name: string; avatarUrl: string | null | undefined; size?: number } = $props();

	let initials = $derived(
		name
			.split(' ')
			.slice(0, 2)
			.map((w) => w[0])
			.join('')
			.toUpperCase()
	);

	// Fall back to initials if the avatar image fails to load, so a dead/slow
	// avatar URL never renders the browser's broken-image glyph. Reset whenever
	// the source changes.
	let failed = $state(false);
	$effect(() => {
		avatarUrl;
		failed = false;
	});
</script>

{#if avatarUrl && !failed}
	<img
		src={avatarUrl}
		alt={name}
		width={size}
		height={size}
		class="rounded-full object-cover"
		style="width:{size}px;height:{size}px"
		onerror={() => (failed = true)}
	/>
{:else}
	<div
		class="flex items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
		style="width:{size}px;height:{size}px;font-size:{Math.floor(size * 0.35)}px"
		aria-label={name}
	>
		{initials}
	</div>
{/if}
