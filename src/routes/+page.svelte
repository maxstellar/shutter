<script lang="ts">
	import type { PageData } from './$types';
	import UserAvatar from '$lib/components/UserAvatar.svelte';
	import PromptCard from '$lib/components/PromptCard.svelte';
	import DayPicker from '$lib/components/DayPicker.svelte';
	import Lightbox from '$lib/components/Lightbox.svelte';
	import { fitText } from '$lib/actions/fitText';

	let { data }: { data: PageData } = $props();

	let lightboxPhotos = $state<string[]>([]);
	let lightboxIndex = $state(0);

	let outsideCohort = $derived(
		(!!data.cohortStart && data.today < data.cohortStart) ||
		(!!data.cohortEnd && data.today > data.cohortEnd)
	);

	function openLightbox(photos: string[], index: number) {
		lightboxPhotos = photos;
		lightboxIndex = index;
	}

	function closeLightbox() {
		lightboxPhotos = [];
	}
</script>

<svelte:head>
	<title>Album - Shutter</title>
</svelte:head>

{#if lightboxPhotos.length > 0}
	<Lightbox photos={lightboxPhotos} startIndex={lightboxIndex} onclose={closeLightbox} />
{/if}

<div class="page-container">
	{#if outsideCohort}
		<div class="flex flex-col items-center gap-4 py-16 text-center">
			<svg fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414" xmlns="http://www.w3.org/2000/svg" aria-label="sun" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" fill="currentColor" width="96" height="96" style="color:var(--color-accent)"><path d="M15.001 5C15.001 4.448 15.449 4 16.001 4C16.553 4 17.001 4.448 17.001 5V7C17.001 7.552 16.553 8 16.001 8C15.449 8 15.001 7.552 15.001 7V5ZM9.12203 7.707C8.73203 7.317 8.09903 7.317 7.70803 7.707C7.31803 8.098 7.31803 8.731 7.70803 9.121L9.12203 10.536C9.51303 10.926 10.146 10.926 10.537 10.536C10.927 10.145 10.927 9.512 10.537 9.121L9.12203 7.707ZM24.536 7.707C24.146 7.317 23.513 7.317 23.122 7.707L21.708 9.121C21.318 9.512 21.318 10.145 21.708 10.536C22.099 10.926 22.732 10.926 23.122 10.536L24.537 9.121C24.927 8.731 24.926 8.098 24.536 7.707Z"/><path d="M20.001 16.176C20.001 13.815 18.156 12 16.001 12C13.846 12 12.001 13.815 12.001 16.176H10.001C10.001 12.765 12.687 10 16.001 10C19.315 10 22.001 12.765 22.001 16.176H20.001Z"/><path d="M15.001 27.1694C15.001 27.7214 15.449 28.1694 16.001 28.1694C16.553 28.1694 17.001 27.7214 17.001 27.1694V25.1694C17.001 24.6174 16.553 24.1694 16.001 24.1694C15.449 24.1694 15.001 24.6174 15.001 25.1694V27.1694ZM9.122 24.4624C8.732 24.8524 8.099 24.8524 7.708 24.4624C7.318 24.0714 7.318 23.4384 7.708 23.0484L9.122 21.6334C9.513 21.2434 10.146 21.2434 10.537 21.6334C10.927 22.0244 10.927 22.6574 10.537 23.0484L9.122 24.4624ZM24.536 24.4624C24.146 24.8524 23.513 24.8524 23.122 24.4624L21.708 23.0484C21.318 22.6574 21.318 22.0244 21.708 21.6334C22.099 21.2434 22.732 21.2434 23.122 21.6334L24.537 23.0484C24.927 23.4384 24.926 24.0714 24.536 24.4624ZM27 17.1694C27.552 17.1694 28 16.7214 28 16.1694C28 15.6174 27.552 15.1694 27 15.1694H25C24.448 15.1694 24 15.6174 24 16.1694C24 16.7214 24.448 17.1694 25 17.1694H27ZM8 16.1694C8 16.7214 7.552 17.1694 7 17.1694H5C4.448 17.1694 4 16.7214 4 16.1694C4 15.6174 4.448 15.1694 5 15.1694H7C7.552 15.1694 8 15.6174 8 16.1694Z"/><path d="M20.001 16.1741C20.001 18.5351 18.156 20.3501 16.001 20.3501C13.846 20.3501 12.001 18.5351 12.001 16.1741H10.001C10.001 19.5851 12.687 22.3501 16.001 22.3501C19.315 22.3501 22.001 19.5851 22.001 16.1741H20.001Z"/></svg>
			<p class="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
				Summertime hasn't started yet! Come back when it's sunnier :)
			</p>
		</div>
	{:else}
		<div class="album-date-row mb-6 flex items-center justify-between gap-3">
			<h1 class="page-heading" use:fitText>
				{new Date(data.today + 'T12:00:00').toLocaleDateString('en-US', {
					weekday: 'long',
					month: 'long',
					day: 'numeric'
				})}
			</h1>
			<div data-onboard="daypicker">
				<DayPicker currentDay={data.today} today={data.today} cohortStart={data.cohortStart} cohortEnd={data.cohortEnd} />
			</div>
		</div>

		{#if data.prompt}
			<PromptCard prompt={data.prompt.text} myCount={data.myPhotoCount} showUploadCta />
		{:else}
			<div class="mb-8 rounded-md border border-zinc-300 bg-zinc-50 px-5 py-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
				No prompt set for today.
			</div>
		{/if}

		{#if data.groups.length === 0}
			<p class="mt-12 text-center text-sm text-zinc-400" data-onboard="album">
				No photos yet today. <a href="/upload" class="underline underline-offset-2" style="color:var(--color-accent)">Be the first.</a>
			</p>
		{:else}
			<div class="space-y-4" data-onboard="album">
				{#each data.groups as group (group.userId)}
					{@const urls = group.photos.map((p) => p.cdn_url)}
					<div class="rounded-md border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-[#131315]">
						<div class="mb-3 flex items-center gap-2">
							<UserAvatar name={group.name} avatarUrl={group.avatarUrl} size={32} />
							<span class="text-base font-medium text-zinc-700 dark:text-zinc-300">{group.name}</span>
							<span class="text-sm text-zinc-400">{group.photos.length}/5</span>
						</div>
						<div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
							{#each group.photos as photo, i (photo.id)}
								<button
									onclick={() => openLightbox(urls, i)}
									class="block cursor-pointer overflow-hidden rounded-md"
								>
									<img
										src={photo.cdn_url}
										alt=""
										loading="lazy"
										class="aspect-square w-full object-cover transition-opacity hover:opacity-90"
									/>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
