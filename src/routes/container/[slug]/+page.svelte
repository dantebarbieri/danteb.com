<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContainerInspectInfo } from 'dockerode';
	import type { Message } from '$lib/api/sse/docker';
	import { localStore } from '$lib/LocalStore.svelte';
	import Spinner from '$lib/spinners/WindowsSpinner.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let container = localStore<ContainerInspectInfo | null>(`container-${data.slug}`, null);
	let loadingState = $state<'cached' | 'loading' | 'error' | 'transmitting'>(
		container.value ? 'cached' : 'loading'
	);
	let errorMessage = $state<string | null>(null);
	let showDetails = $state(false);
	const toggleDetails = () => (showDetails = !showDetails);

	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);

		// Initialize the SSE connection.
		const eventSource = new EventSource(`/api/sse/docker/${data.slug}`);

		eventSource.onmessage = (event: MessageEvent<string>) => {
			try {
				const message = JSON.parse(event.data) as Message<ContainerInspectInfo>;
				if (message.status === 'loading') {
					if (loadingState !== 'cached') {
						loadingState = 'loading';
						container.value = null;
					}
					errorMessage = null;
				} else if (message.status === 'error') {
					loadingState = 'error';
					container.value = null;
					errorMessage = message.error;
				} else if (message.status === 'transmitting') {
					loadingState = 'transmitting';
					container.value = message.contents;
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

		// Cleanup both the interval and the SSE connection on unmount.
		return () => {
			clearInterval(interval);
			eventSource.close();
		};
	});

	let timeDiff = (startTime: Date, endTime: Date): string => {
		const diff = endTime.getTime() - startTime.getTime();

		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0)
			return `${days} days, ${hours % 24} hours, ${minutes % 60} minutes, ${seconds % 60} seconds`;
		if (hours > 0) return `${hours} hours, ${minutes % 60} minutes, ${seconds % 60} seconds`;
		if (minutes > 0) return `${minutes} minutes, ${seconds % 60} seconds`;
		if (seconds > 0) return `${seconds} seconds`;
		return 'None';
	};

	let uptime = $derived.by(() => {
		if (!container.value?.State?.StartedAt) return 'Unknown';

		const startDate = new Date(container.value.State.StartedAt);
		const isContainerRunning = container.value?.State?.Status === 'running';
		const endDate =
			!isContainerRunning && container.value.State.FinishedAt
				? new Date(container.value.State.FinishedAt)
				: new Date(now);
		return timeDiff(startDate, endDate);
	});

	let downtime = $derived.by(() => {
		if (!container.value?.State?.FinishedAt) return 'Unknown';

		const startDate = new Date(container.value.State.FinishedAt);
		const isContainerRunning = container.value?.State?.Status === 'running';
		const endDate = !isContainerRunning ? new Date(now) : startDate;
		return timeDiff(startDate, endDate);
	});

	let flatContainer = $derived.by(() => {
		return container.value ? flattenObject(container.value) : [];
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

	$inspect(loadingState);
	$inspect(container.value);
	$inspect(errorMessage);
	$inspect(uptime);
	$inspect(downtime);
</script>

{#if loadingState === 'loading'}
	<h1>Loading Container</h1>
	<div class="loading">
		<Spinner />
	</div>
{:else if loadingState === 'error'}
	<h1>Container Error</h1>
	<p>{errorMessage}</p>
{:else if loadingState === 'transmitting' || loadingState === 'cached'}
	{#if container.value}
		{#if loadingState === 'cached'}
			<h1>{container.value.Name.replace(/^\//, '')} <i>(Cached)</i></h1>
		{:else}
			<h1>{container.value.Name.replace(/^\//, '')}</h1>
		{/if}
		<div class="summary">
			<p>
				<strong>Status:</strong>
				{container.value.State?.Status || 'Unknown'}
			</p>
			<p>
				{#if container.value.State.Status === 'running'}
					<strong>Uptime:</strong>
				{:else}
					<strong>Ran for:</strong>
				{/if}
				{uptime}
			</p>
			<p>
				{#if container.value.State.Status !== 'running'}
					<strong>Downtime:</strong>
				{/if}
				{downtime}
			</p>
			{#if container.value.State?.Health}
				<p>
					<strong>Health:</strong>
					{container.value.State.Health.Status}
				</p>
			{/if}
		</div>
		<button onclick={toggleDetails}>
			{showDetails ? 'Hide Details' : 'Show All Details'}
		</button>
		{#if showDetails}
			<table>
				<thead>
					<tr>
						<th>Property (JSON Path)</th>
						<th>Value</th>
					</tr>
				</thead>
				<tbody>
					{#each flatContainer as { key, value } (key)}
						<tr>
							<td>{key}</td>
							<td>{value}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{:else}
		<h1>No Container</h1>
		<p>
			No container data available. The container with id
			<code>{data.slug}</code>
			may not exist.
		</p>
	{/if}
{/if}

<style>
	button {
		align-self: center;
		background-color: var(--secondary);
		background-image: none;
		background-position: 0 90%;
		background-repeat: repeat no-repeat;
		background-size: 4px 3px;
		border-radius: 15px 225px 255px 15px 15px 255px 225px 15px;
		border-style: solid;
		border-width: 2px;
		box-shadow: rgba(0, 0, 0, 0.2) 15px 28px 25px -18px;
		box-sizing: border-box;
		color: var(--text);
		cursor: pointer;
		display: inline-block;
		font-family: Neucha, sans-serif;
		font-size: 1rem;
		line-height: 23px;
		outline: none;
		padding: 0.75rem;
		text-decoration: none;
		transition: all 235ms ease-in-out;
		border-bottom-left-radius: 15px 255px;
		border-bottom-right-radius: 225px 15px;
		border-top-left-radius: 255px 15px;
		border-top-right-radius: 15px 225px;
		user-select: none;
		-webkit-user-select: none;
		touch-action: manipulation;
	}

	button:hover {
		box-shadow: rgba(0, 0, 0, 0.3) 2px 8px 8px -5px;
		transform: translate3d(0, 2px, 0);
	}

	button:focus {
		box-shadow: rgba(0, 0, 0, 0.3) 2px 8px 4px -6px;
	}
</style>
