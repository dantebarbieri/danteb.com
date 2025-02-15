<script lang="ts">
	interface Props {
		name: string;
		state: string;
		status: string;
	}

	let { name, state, status }: Props = $props();
</script>

<article data-health={state} aria-labelledby={name} aria-describedby="{name}-state {name}-status">
	<header>
		<h2 id={name}>
			<a href="/container/{name}" aria-label="View details for {name}">{name}</a>
		</h2>
		<label for="{name}-state">Status:</label>
		<span id="{name}-state" aria-live="polite">{state}</span>
	</header>
	<p class="status" id="{name}-status" aria-live="polite">{status}</p>
</article>

<style>
	article {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 0.2rem 1rem;
		border-radius: 0.67rem;
		background-color: var(--background-300);
		box-shadow: 5px 5px 10px var(--accent-100);
	}

	article[data-health='exited'],
	article[data-health='dead'],
	article[data-health='restarting'] {
		opacity: 0.6;
	}

	article[data-health='exited'] h2,
	article[data-health='dead'] h2 {
		text-decoration: line-through;
		opacity: 0.7;
	}

	article[data-health='restarting'] {
		border: 1px dashed var(--text-600);
	}

	article::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(0deg, transparent, transparent 30%, var(--accent));
		rotate: -45deg;
		translate: 0;
		transition: all 0.5s ease;
		opacity: 0;
	}

	@media (prefers-reduced-motion: no-preference) {
		article {
			transition: all 0.5s ease;
			position: relative;
			overflow: hidden;
		}

		article:hover {
			transform: scale(1.025);
			box-shadow: 0 0 20px var(--accent);
		}

		article:hover::before {
			opacity: 1;
			translate: 100%;
		}
	}

	a {
		text-decoration: none;
		color: currentColor;
	}

	a:hover {
		text-decoration: underline;
	}

	.status {
		color: var(--text-600);
		font-weight: bold;
		text-align: right;
		cursor: default;
	}
</style>
