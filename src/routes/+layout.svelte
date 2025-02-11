<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	let { children } = $props();

	onMount(() => {
		const setTheme = () => {
			if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
				document.documentElement.style.colorScheme = 'dark';
			} else {
				document.documentElement.style.colorScheme = 'light';
			}
		};

		// Set theme on initial load
		setTheme();

		// Watch for changes in the media query's value
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setTheme);

		return () => {
			// Cleanup listener on component destroy
			window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', setTheme);
		};
	});
</script>

<header>
	<nav>
		<a aria-current={page.route.id === "/" ? "page" : undefined} href="/">home</a>
		<a aria-current={page.route.id?.startsWith("/container") ? "page" : undefined} href="/container">containers</a>
		<a aria-current={page.route.id?.startsWith("/service") ? "page" : undefined} href="/service">services</a>
	</nav>
</header>

<main>
	{@render children()}
</main>

<footer>
	<p id="copyright">&copy; 2025 Dante Barbieri. All rights reserved.</p>
</footer>

<style>
	header {
		position: relative;
		z-index: 2;
		width: 100%;
		padding: 4vw 6vw;
		pointer-events: auto;
	}

	@media only screen and (pointer: coarse) and (max-width: 1024px), screen and (max-width: 800px) {
		header {
			padding: 6vw;
			margin-bottom: 1.25rem;
		}
	}

	a:not([aria-current='page']):hover {
		border-bottom: 1px solid currentColor;
		transition: border-bottom 0.2s ease-in-out;
	}

	a[aria-current='page'] {
		border-bottom: 1px solid currentColor;
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 0 auto;
		padding-left: 6vw;
		padding-right: 6vw;
	}

	footer {
		margin: 0 auto;
		margin-top: auto;
		align-items: flex-start;
		display: flex;
		flex-direction: column;
		padding: 3.3vmax 0;
		justify-content: center;
		width: 100%;
		padding: 0 6vw;
	}
</style>
