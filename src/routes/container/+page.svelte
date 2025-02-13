<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContainerInfo } from 'dockerode';
	import Container from '$lib/Container.svelte';

	let containerUpdates = $state<ContainerInfo[]>([]);

	let eventSource: EventSource;

	onMount(() => {
		eventSource = new EventSource('/api/sse/docker');

		eventSource.onmessage = (event: MessageEvent<string>) => {
			try {
				const data = JSON.parse(event.data) as ContainerInfo[];
				containerUpdates = data;
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
	<ul>
		{#each containerUpdates as container (container.Id)}
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
	}
</style>