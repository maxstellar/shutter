<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Sign in - Capsule</title>
</svelte:head>

<div class="flex min-h-[calc(100dvh-3rem)] items-center justify-center px-8 sm:px-4">
	<div class="w-full max-w-sm sm:max-w-md">
		<h1 class="mb-2 text-3xl font-semibold text-zinc-900 sm:text-4xl dark:text-zinc-100">Capsule</h1>
		<p class="mb-8 text-sm text-zinc-400 sm:mb-10 sm:text-base">
			A daily photo journal & shared album for Hack Club interns. Sign in with your Hack Club
			account to continue.
		</p>

		<a
			href={data.authorizeUrl}
			class="flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-white transition-colors sm:py-3.5 sm:text-base"
			style="background-color:var(--color-accent)"
		>
			Sign in with Hack Club
		</a>

		<p class="mt-5 text-center text-xs text-zinc-500 sm:mt-6 sm:text-sm">
			Don't have access? Ask @maxstellar on Slack to whitelist you.
		</p>
	</div>
</div>
