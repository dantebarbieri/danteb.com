<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContainerInfo } from 'dockerode';
	import type {LoadingMessage, ErrorMessage, TransmittingMessage, Message} from '$lib/api/sse/docker';
	import Container from '$lib/Container.svelte';

	let loadingState = $state<"loading" | "error" | "transmitting">('loading');
	let containerUpdates = $state<ContainerInfo[]>([]);
	let errorMessage = $state<string | null>(null);

	let eventSource: EventSource;

	let filterQuery = $state('');

	onMount(() => {
		eventSource = new EventSource('/api/sse/docker');

		eventSource.onmessage = (event: MessageEvent<string>) => {
			try {
				const message = JSON.parse(event.data) as Message<ContainerInfo[]>;
				if (message.status === 'loading') {
					loadingState = 'loading';
					containerUpdates = [];
					errorMessage = null;
				} else if (message.status === 'error') {
					loadingState = 'error';
					containerUpdates = [];
					errorMessage = message.error;
				} else if (message.status === 'transmitting') {
					loadingState = 'transmitting';
					containerUpdates = message.contents;
					errorMessage = null;
				}
				loadingState = event.
			} catch (err) {
				console.error('Error parsing SSE data:', err);
			}
		};

		eventSource.onerror = (error: Event) => {
			console.error('EventSource error:', error);
		};

		return () => {
			eventSource.close();
		};
	});

	$inspect(containerUpdates);
</script>

<h1>Docker Containers</h1>
{#if containerUpdates && containerUpdates.length > 0}
	<input
		type="text"
		placeholder="Filter containers by name"
		bind:value={filterQuery}
	>
	<ul>
		{#each containerUpdates.filter((container) =>
			container.Names
				.map((name) => name.replace(/^\//, ''))
				.join(', ')
				.toLowerCase()
				.includes(filterQuery.toLowerCase())
		) as container (container.Id)}
			<Container
				slug={container.Id}
				name={container.Names.map((name) => name.replace(/^\//, '')).join(', ')}
				status={container.Status}
				state={container.State}
			/>
		{/each}
	</ul>
{:else}
	<p>No container data available.</p>
{/if}

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(25rem, 1fr));
		grid-gap: 1rem;
		padding: 0;
	}

	input {
		padding: 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid var(--accent-100);
		background-color: var(--background-100);
		color: var(--text-800);
		font-size: 1rem;
	}
</style>