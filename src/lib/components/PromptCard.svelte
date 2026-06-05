<script lang="ts">
	let {
		prompt,
		myCount,
		showUploadCta = false
	}: {
		prompt: string;
		myCount: number;
		showUploadCta?: boolean;
	} = $props();

</script>

<div
	class="mb-6 rounded-md border border-zinc-300 px-4 py-3 dark:border-zinc-800"
>
	<div class="flex items-start justify-between gap-4">
		<div>
			<p class="mb-0.5 text-xs font-medium uppercase tracking-wide text-zinc-400">Today's prompt</p>
			<p class="text-sm text-zinc-800 dark:text-zinc-200">{prompt}</p>
		</div>
		<div class="shrink-0 text-right">
			<p class="text-xs text-zinc-400">{myCount}/5 photos</p>
		</div>
	</div>

	<div class="mt-2 flex items-center gap-1">
		{#each Array(5) as _, i}
			<div
				class="h-2 flex-1 rounded-full transition-colors"
				style={i < myCount ? 'background-color:var(--color-accent)' : ''}
				class:bg-zinc-300={i >= myCount && i < 3}
				class:dark:bg-zinc-600={i >= myCount && i < 3}
				class:bg-zinc-100={i >= myCount && i >= 3}
				class:dark:bg-zinc-800={i >= myCount && i >= 3}
			></div>
		{/each}
	</div>

	{#if showUploadCta}
		<a
			href="/upload"
			class="mt-3 flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors"
			style={myCount >= 5 ? 'background-color:#71717a' : 'background-color:var(--color-accent)'}
		>
			{myCount >= 5 ? 'Edit your photos' : 'Upload photos'}
		</a>
	{/if}
</div>

