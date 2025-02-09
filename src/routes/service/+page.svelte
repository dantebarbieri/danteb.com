<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>Services</h1>

<ul>
	{#each data.summaries as { slug, title, status }}
		<li><a href="/service/{slug}">{title}</a> <span>{status}</span></li>
	{/each}
</ul>
