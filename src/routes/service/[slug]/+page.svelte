<script lang="ts">
	import type { ContainerInspectInfo } from 'dockerode';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let container = $state<ContainerInspectInfo | null>(null);

	const eventSource = new EventSource(`/api/sse/docker/${data.slug}`);

	eventSource.onmessage = (event: MessageEvent<string>) => {
		try {
			const data = JSON.parse(event.data) as ContainerInspectInfo;
			container = data;
		} catch (err) {
			console.error('Error parsing SSE data:', err);
		}
	};

	eventSource.onerror = (error: Event) => {
		console.error('EventSource error:', error);
	};

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
			{#each Object.entries(container) as [ key , value ] }
				<tr>
					<td>{key}</td>
					<td>{value}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<p>No container data available.</p>
{/if}
