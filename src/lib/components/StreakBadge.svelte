<script lang="ts">
	let { streak }: { streak: number } = $props();
</script>

{#if streak > 0}
	<span
		class="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-sm font-medium text-accent"
		style="--tw-text-opacity:1"
	>
		{streak}d
	</span>
{:else}
	<span class="inline-flex items-center rounded-md px-2 py-1 text-sm text-zinc-400">0d</span>
{/if}

<style>
	.text-accent {
		color: var(--color-accent);
	}
	.border-accent\/30 {
		border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
	}
	.bg-accent\/10 {
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
	}
</style>
