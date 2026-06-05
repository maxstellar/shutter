<script lang="ts">
	import { page } from '$app/stores';
	import { navigating } from '$app/state';
	import { Plus } from 'lucide-svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import UserAvatar from './UserAvatar.svelte';
	import PhotosIcon from './icons/PhotosIcon.svelte';
	import TrophyIcon from './icons/TrophyIcon.svelte';
	import CameraIcon from './icons/CameraIcon.svelte';
	import PersonBadgeIcon from './icons/PersonBadgeIcon.svelte';
	import type { InferSelectModel } from 'drizzle-orm';
	import type { users } from '$lib/server/db/schema';

	type User = InferSelectModel<typeof users>;
	let { user, isAdmin, isWhitelisted }: { user: User | null; isAdmin: boolean; isWhitelisted: boolean } = $props();

	let path = $derived(navigating?.to?.url?.pathname ?? $page.url.pathname);

	function active(href: string) {
		return path === href || path.startsWith(href + '/');
	}
</script>

<!-- Desktop top header -->
<header
	class="sticky top-0 z-40 hidden border-b border-zinc-300 bg-white/90 backdrop-blur sm:block dark:border-zinc-800 dark:bg-zinc-950/90"
>
	<div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
		<a
			href="/"
			class="mr-auto text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
		>
			Capsule
		</a>

		{#if user && isWhitelisted}
			<nav class="flex items-center gap-1">
				<a
					href="/upload"
					class="flex h-10 items-center gap-2 rounded-md px-3.5 text-base transition-colors"
					class:nav-active={active('/upload')}
					class:nav-idle={!active('/upload')}
				>
					<CameraIcon size={19} />
					Upload
				</a>
				<a
					href="/"
					class="flex h-10 items-center gap-2 rounded-md px-3.5 text-base transition-colors"
					class:nav-active={path === '/' || active('/album')}
					class:nav-idle={path !== '/' && !active('/album')}
				>
					<PhotosIcon size={19} />
					Album
				</a>
				<a
					href="/streaks"
					class="flex h-10 items-center gap-2 rounded-md px-3.5 text-base transition-colors"
					class:nav-active={active('/streaks')}
					class:nav-idle={!active('/streaks')}
				>
					<TrophyIcon size={19} />
					Streaks
				</a>
				{#if isAdmin}
					<a
						href="/admin"
						class="flex h-10 items-center gap-2 rounded-md px-3.5 text-base transition-colors"
						class:nav-active={active('/admin')}
						class:nav-idle={!active('/admin')}
					>
						<PersonBadgeIcon size={19} />
						Admin
					</a>
				{/if}
			</nav>

			<a href="/settings" aria-label="Settings">
				<UserAvatar name={user.name} avatarUrl={user.avatar_url} size={36} />
			</a>
		{/if}

		<ThemeToggle />
	</div>
</header>

<!-- Mobile top bar -->
{#if user && isWhitelisted}
	<header
		class="sticky top-0 z-40 flex h-12 items-center justify-end gap-2 border-b border-zinc-300 bg-white/90 px-4 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
	>
		{#if isAdmin}
			<a
				href="/admin"
				aria-label="Admin"
				class="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
				class:nav-active={active('/admin')}
				class:nav-idle={!active('/admin')}
			>
				<PersonBadgeIcon size={21} />
			</a>
		{/if}
		<ThemeToggle />
		<a href="/settings" aria-label="Settings">
			<UserAvatar name={user.name} avatarUrl={user.avatar_url} size={28} />
		</a>
	</header>
{:else}
	<header
		class="sticky top-0 z-40 flex h-12 items-center justify-between border-b border-zinc-300 bg-white/90 px-4 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
	>
		<span class="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
			>Capsule</span
		>
		<ThemeToggle />
	</header>
{/if}

<!-- Mobile bottom nav -->
{#if user && isWhitelisted}
	<nav
		class="bottom-nav-padding fixed right-0 bottom-0 left-0 z-40 flex items-center border-t border-zinc-300 bg-white/95 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
	>
		<div class="mx-auto flex w-full max-w-xs items-center gap-14 px-6">
			<a
				href="/"
				class="flex flex-1 flex-col items-center gap-1.5 py-2 text-xs transition-colors"
				class:bottom-active={path === '/' || active('/album')}
				class:bottom-idle={path !== '/' && !active('/album')}
			>
				<PhotosIcon size={32} />
				<span>Album</span>
			</a>

			<a
				href="/upload"
				aria-label="Upload photo"
				class="flex h-14 w-16 flex-none items-center justify-center rounded-2xl shadow-md transition-transform active:scale-95"
				style="background-color:var(--color-accent)"
			>
				<Plus size={30} color="white" strokeWidth={2.5} />
			</a>

			<a
				href="/streaks"
				class="flex flex-1 flex-col items-center gap-1.5 py-2 text-xs transition-colors"
				class:bottom-active={active('/streaks')}
				class:bottom-idle={!active('/streaks')}
			>
				<TrophyIcon size={32} />
				<span>Streaks</span>
			</a>
		</div>
	</nav>
{/if}

<style>
	.nav-active {
		background-color: color-mix(in srgb, var(--color-accent) 10%, transparent);
		color: var(--color-accent);
		font-weight: 500;
	}
	.nav-idle {
		color: #71717a;
	}
	.nav-idle:hover {
		background-color: #f4f4f5;
		color: #09090b;
	}
	:global(html.dark) .nav-idle {
		color: #a1a1aa;
	}
	:global(html.dark) .nav-idle:hover {
		background-color: #27272a;
		color: #fafafa;
	}

	.bottom-active {
		color: var(--color-accent);
	}
	.bottom-idle {
		color: #71717a;
	}
	:global(html.dark) .bottom-idle {
		color: #a1a1aa;
	}
</style>
