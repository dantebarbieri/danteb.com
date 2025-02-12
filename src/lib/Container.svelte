<script lang="ts">
	let { slug, name, uptime, status, health } = $props();
</script>

<article data-health={health} labeledby="title-{slug}">
	<header>
		<h2 id="title-{slug}"><a href="/container/{slug}">{name}</a></h2>
		<label for="status">Status:</label> <span id="status">{status}</span>
	</header>
	<p>{uptime}</p>
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1rem;
		border-bottom: 1px solid currentColor;
		max-width: 16rem;
	}

	[data-health='healthy'] {
		background-color: lightgreen;
	}

	[data-health='unhealthy'] {
		background-color: lightred;
	}

	a {
		text-decoration: none;
		color: currentColor;
	}

	a:hover {
		text-decoration: underline;
	}

	p {
		text-align: right;
	}
</style>
