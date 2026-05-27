<script lang="ts">
	import { renderSVG } from 'uqr';

	let { data }: { data: string } = $props();

	// uqr generates the QR matrix and renders it to an inline SVG string. It's pure
	// JS, so this runs during SSR too — the code is on the page from first paint.
	// `data` is our own origin URL, so the markup is trusted.
	const svg = $derived(renderSVG(data, { border: 2, whiteColor: '#fff', blackColor: '#0b2a3a' }));
</script>

<div class="qr-card">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html svg}
</div>

<style>
	.qr-card {
		background: #fff;
		padding: 14px;
		border-radius: 14px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
		line-height: 0;
		width: 100%;
	}
	.qr-card :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
</style>
