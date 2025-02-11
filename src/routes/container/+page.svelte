<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContainerInfo } from 'dockerode';

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
	<table>
		<thead>
			<tr>
				<th>Container</th>
				<th>Status</th>
			</tr>
		</thead>
		<tbody>
			{#each containerUpdates as container}
				<tr>
					<td>
						<a href="/container/{container.Id}">
							{container.Names.map((name) => name.replace(/^\//, '')).join(', ')}
						</a>
					</td>
					<td>{container.Status}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No container data available.</p>
{/if}
