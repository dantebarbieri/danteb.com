<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { ContainerInfo } from 'dockerode';

	let containerUpdates: ContainerInfo[] = [];

	const eventSource = new EventSource('/api/sse/docker');

	eventSource.onmessage = (event: MessageEvent<string>) => {
		try {
			const data = JSON.parse(event.data) as ContainerInfo[];
			containerUpdates = data;
			console.log(containerUpdates);
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
</script>

<h1>Docker Container Updates</h1>
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
						<a href="/service/{container.Id}">
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
