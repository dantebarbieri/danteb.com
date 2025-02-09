<script>
	let { children } = $props();
</script>

<nav>
	<a href="/">home</a>
	<a href="/service">services</a>
</nav>

{@render children()}
