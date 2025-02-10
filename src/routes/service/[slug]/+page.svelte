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

	function flattenObject(
		obj: any,
		prefix: string = ''
	): { key: string; value: any }[] {
		let entries: { key: string; value: any }[] = [];

		if (obj !== null && typeof obj === 'object') {
			if (Array.isArray(obj)) {
				obj.forEach((item, index) => {
					const newPrefix = `${prefix}[${index}]`;
					if (item !== null && typeof item === 'object') {
						entries.push(...flattenObject(item, newPrefix));
					} else {
						entries.push({ key: newPrefix, value: item });
					}
				});
			} else {
				for (const [key, value] of Object.entries(obj)) {
					const newPrefix = prefix ? `${prefix}.${key}` : key;
					if (value !== null && typeof value === 'object') {
						entries.push(...flattenObject(value, newPrefix));
					} else {
						entries.push({ key: newPrefix, value });
					}
				}
			}
		} else {
			entries.push({ key: prefix, value: obj });
		}

		return entries;
	}

	$inspect(container);
</script>

{#if container}
	<h1>{container.Name.replace(/^\//, '')} Updates</h1>
	<table>
		<thead>
			<tr>
				<th>Property (JSON Path)</th>
				<th>Value</th>
			</tr>
		</thead>
		<tbody>
			{#each flattenObject(container) as { key, value }}
				<tr>
					<td>{key}</td>
					<td>{value}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{:else}
	<h1>Docker Container Updates</h1>
	<p>No container data available.</p>
{/if}
