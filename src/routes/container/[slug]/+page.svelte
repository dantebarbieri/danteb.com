<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContainerInspectInfo } from 'dockerode';
	import type { Message } from '$lib/api/sse/docker';
	import Spinner from '$lib/Spinner.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let loadingState = $state<'loading' | 'error' | 'transmitting'>('loading');
	let container = $state<ContainerInspectInfo | null>(null);
	let errorMessage = $state<string | null>(null);

	let eventSource: EventSource;

	onMount(() => {
		eventSource = new EventSource(`/api/sse/docker/${data.slug}`);

		eventSource.onmessage = (event: MessageEvent<string>) => {
			try {
				const message = JSON.parse(event.data) as Message<ContainerInspectInfo>;
				if (message.status === 'loading') {
					loadingState = 'loading';
					container = null;
					errorMessage = null;
				} else if (message.status === 'error') {
					loadingState = 'error';
					container = null;
					errorMessage = message.error;
				} else if (message.status === 'transmitting') {
					loadingState = 'transmitting';
					container = message.contents;
					errorMessage = null;
				}
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

	function flattenObject(obj: unknown, prefix: string = ''): { key: string; value: unknown }[] {
		let entries: { key: string; value: unknown }[] = [];

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

{#if loadingState === 'loading'}
	<h1>Loading Container</h1>
	<div class="loading">
		<Spinner />
	</div>
{:else if loadingState === 'error'}
	<h1>Container Error</h1>
	<p>{errorMessage}</p>
{:else if loadingState === 'transmitting'}
	{#if container}
		<h1>{container.Name.replace(/^\//, '')}</h1>
		<table>
			<thead>
				<tr>
					<th>Property (JSON Path)</th>
					<th>Value</th>
				</tr>
			</thead>
			<tbody>
				{#each flattenObject(container) as { key, value } (key)}
					<tr>
						<td>{key}</td>
						<td>{value}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<h1>No Container</h1>
		<p>
			No container data available. The container with id
			<code>{data.slug}</code>
			may not exist.
		</p>
	{/if}
{/if}
