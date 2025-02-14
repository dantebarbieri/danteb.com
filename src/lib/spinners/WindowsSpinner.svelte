<div class="lds-roller">
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
	<div></div>
</div>

<style>
	.lds-roller,
	.lds-roller div,
	.lds-roller div:after {
		box-sizing: border-box;
	}
	.lds-roller {
		display: inline-block;
		position: relative;
		width: 5rem;
		height: 5rem;
		cursor: wait;
	}
	.lds-roller div {
		animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
		transform-origin: 2.5rem 2.5rem;
	}
	.lds-roller div:after {
		content: ' ';
		display: block;
		position: absolute;
		width: 0.45rem;
		height: 0.45rem;
		border-radius: 50%;
		background: var(--primary);
		margin: -0.225rem 0 0 -0.225rem;
	}
	.lds-roller div:nth-child(1) {
		animation-delay: -0.036s;
	}
	.lds-roller div:nth-child(1):after {
		top: 3.91421375rem;
		left: 3.91421375rem;
	}
	.lds-roller div:nth-child(2) {
		animation-delay: -0.072s;
	}
	.lds-roller div:nth-child(2):after {
		top: 4.23205062rem;
		left: 3.5rem;
	}
	.lds-roller div:nth-child(3) {
		animation-delay: -0.108s;
	}
	.lds-roller div:nth-child(3):after {
		top: 4.43185188rem;
		left: 3.01763812rem;
	}
	.lds-roller div:nth-child(4) {
		animation-delay: -0.144s;
	}
	.lds-roller div:nth-child(4):after {
		top: 4.5rem;
		left: 2.5rem;
	}
	.lds-roller div:nth-child(5) {
		animation-delay: -0.18s;
	}
	.lds-roller div:nth-child(5):after {
		top: 4.43185188rem;
		left: 1.98236188rem;
	}
	.lds-roller div:nth-child(6) {
		animation-delay: -0.216s;
	}
	.lds-roller div:nth-child(6):after {
		top: 4.23205062rem;
		left: 1.5rem;
	}
	.lds-roller div:nth-child(7) {
		animation-delay: -0.252s;
	}
	.lds-roller div:nth-child(7):after {
		top: 3.91421375rem;
		left: 1.08578625rem;
	}
	.lds-roller div:nth-child(8) {
		animation-delay: -0.288s;
	}
	.lds-roller div:nth-child(8):after {
		top: 3.5rem;
		left: 0.76794938rem;
	}
	@keyframes lds-roller {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
