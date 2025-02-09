<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{data.container.Name.replace(/^\//, '')}</h1>
<div><p>Status: <span>{data.container.State.Status}</span></p></div>
