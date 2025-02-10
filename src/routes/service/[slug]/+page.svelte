<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { ContainerInspectInfo } from 'dockerode';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let container = $state<ContainerInspectInfo | null>(null);

	const eventSource = new EventSource(`/api/sse/docker/${data.slug}`);

	eventSource.onmessage = (event: MessageEvent<string>) => {
		try {
			const parsed = JSON.parse(event.data) as ContainerInspectInfo;
			container = parsed;
		} catch (err) {
			console.error('Error parsing SSE data:', err);
		}
	};

	eventSource.onerror = (error: Event) => {
		console.error('EventSource error:', error);
	};

	onDestroy(() => {
		eventSource.close();
	});

	$inspect(container);
</script>

<h1>Docker Container Updates</h1>
{#if container}
	<table>
		<thead>
			<tr>
				<th>Property</th>
				<th>Value</th>
			</tr>
		</thead>
		<tbody>
			{#each Object.entries(container) as [key, value]}
				{#if typeof value === 'object'}
					{#each Object.entries(value) as [subKey, subValue]}
						<tr>
							<td>{subKey}</td>
							<td>{subValue}</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td>{key}</td>
						<td>{value}</td>
					</tr>
					
				{/if}
			{/each}
		</tbody>
	</table>
{:else}
	<p>No container data available.</p>
{/if}
