<script lang="ts">
    interface Props {
        slug: string;
        name: string;
        state: string;
        status: string;
    }

    let { slug, name, state, status }: Props = $props();
</script>

<article data-health={state} aria-labelledby="name-{slug}" aria-describedby="state-{slug} status-{slug}">
    <header>
        <h2 id="name-{slug}">
            <a href="/container/{slug}" aria-label="View details for {name}">{name}</a>
        </h2>
        <label for="state-{slug}">Status:</label> 
        <span id="state-{slug}" aria-live="polite">{state}</span>
    </header>
    <p class="status" id="status-{slug}" aria-live="polite">{status}</p>
</article>

<style>
    article {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1rem;
        border-radius: 1rem;
        max-width: 16rem;
        background-color: var(--background-300);
        box-shadow: 5px 5px 10px var(--accent-100);
    }

    article::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: linear-gradient(0deg, transparent, transparent 30%, var(--accent));
        transform: rotate(-45deg);
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
            transform: scale(1.05);
            box-shadow: 0 0 20px var(--accent);
        }

        article:hover::before {
            opacity: 1;
            transform: rotate(-45deg) translateY(100%);
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
