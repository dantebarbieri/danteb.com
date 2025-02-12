<script lang="ts">
	interface Props {
		slug: string;
		name: string;
		state: string;
		status: string;
	}

	let { slug, name, state, status }: Props = $props();
</script>

<article data-health={state}>
	<header>
		<h2><a href="/container/{slug}">{name}</a></h2>
		<label for="state-{slug}">Status:</label> <span id="state-{slug}">{state}</span>
	</header>
	<p>{status}</p>
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

	[data-health='running'] {
		background-color: light-dark(lightgreen, darkgreen);
	}

	[data-health='restarting'] {
		background-color: light-dark(lightgoldenrodyellow, darkgoldenrod);
	}

	[data-health='paused'] {
		background-color: light-dark(lightblue, darkblue);
	}

	[data-health='exited'] {
		background-color: light-dark(lightcoral, darkred);
	}

	[data-health='dead'] {
		background-color: light-dark(lightgray, darkgray);
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
