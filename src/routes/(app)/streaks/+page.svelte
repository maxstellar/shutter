<script lang="ts">
	import type { PageData } from './$types';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import StreakBadge from '$lib/components/StreakBadge.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Streaks - Capsule</title>
</svelte:head>

<div class="mx-auto w-full px-6 py-8 sm:max-w-2xl sm:py-12">
	<h1 class="mb-6 text-2xl font-semibold text-zinc-900 sm:text-3xl dark:text-zinc-100">Streaks</h1>

	{#if data.myStreak}
		<div class="mb-6 rounded-md border border-zinc-300 px-4 py-3 dark:border-zinc-800">
			<p class="mb-1 text-xs text-zinc-500">Your streak</p>
			<div class="flex items-baseline gap-1.5">
				<span class="text-3xl font-semibold text-zinc-900 dark:text-zinc-100"
					>{data.myStreak.current}</span
				>
				<span class="text-lg text-zinc-500">day{data.myStreak.current !== 1 ? 's' : ''}</span>
			</div>
			<p class="mt-1 text-xs text-zinc-400">
				Longest: {data.myStreak.longest} day{data.myStreak.longest !== 1 ? 's' : ''}
			</p>
		</div>
	{/if}

	<h2 class="mb-3 text-sm font-medium tracking-wide text-zinc-500 uppercase">Leaderboard</h2>

	<div class="space-y-px">
		{#each data.streaks as member, i (member.id)}
			<div
				class="flex items-center gap-3 rounded-md py-3 pr-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
			>
				<span class="w-5 text-right text-xs text-zinc-400">{i + 1}</span>
				<UserAvatar name={member.name} avatarUrl={member.avatar_url} size={36} />
				<span class="flex-1 text-base text-zinc-800 dark:text-zinc-200">{member.name}</span>
				<StreakBadge streak={member.current} />
			</div>
		{/each}
	</div>
</div>
