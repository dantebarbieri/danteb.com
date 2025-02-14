<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContainerInfo } from 'dockerode';
	import type { Message } from '$lib/api/sse/docker';
	import { localStore } from '$lib/LocalStore.svelte';
	import Container from '$lib/Container.svelte';
	import Spinner from '$lib/spinners/GridSpinner.svelte';

	let containers = localStore<ContainerInfo[]>('containers', []);
	let loadingState = $state<'loading' | 'error' | 'transmitting'>(
		containers.value ? 'transmitting' : 'loading'
	);
	let errorMessage = $state<string | null>(null);

	let eventSource: EventSource;

	let filterQuery = $state('');

	onMount(() => {
		eventSource = new EventSource('/api/sse/docker');

		eventSource.onmessage = (event: MessageEvent<string>) => {
			try {
				const message = JSON.parse(event.data) as Message<ContainerInfo[]>;
				if (message.status === 'loading') {
					if (!(containers.value && containers.value.length > 0)) {
						loadingState = 'loading';
						containers.value = [];
					}
					errorMessage = null;
				} else if (message.status === 'error') {
					loadingState = 'error';
					containers.value = [];
					errorMessage = message.error;
				} else if (message.status === 'transmitting') {
					loadingState = 'transmitting';
					containers.value = message.contents;
					errorMessage = null;
				}
			} catch (err) {
				console.error('Error parsing SSE data:', err);
			}
		};

		eventSource.onerror = (error: Event) => {
			console.error('EventSource error:', error);
			eventSource.close();
			loadingState = 'error';
			errorMessage = 'Error connecting to server.';
		};

		return () => {
			eventSource.close();
		};
	});

	$inspect(loadingState)
	$inspect(containers.value);
	$inspect(errorMessage);
</script>

<h1>Docker Containers</h1>
{#if loadingState === 'loading'}
	<div class="loading">
		<Spinner />
	</div>
{:else if loadingState === 'error'}
	<p>{errorMessage}</p>
{:else if loadingState === 'transmitting'}
	{#if containers.value && containers.value.length > 0}
		<input type="text" placeholder="Filter containers by name" bind:value={filterQuery} />
		<ul>
			{#each containers.value.filter( (container) => container.Names.map( (name) => name.replace(/^\//, '') )
						.join(', ')
						.toLowerCase()
						.includes(filterQuery.toLowerCase()) ) as container (container.Id)}
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

	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
