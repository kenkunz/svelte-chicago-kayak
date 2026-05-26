<script lang="ts">
	import type { Side } from '$lib/types';

	let { disabled = false, onPaddle }: { disabled?: boolean; onPaddle: (side: Side) => void } =
		$props();

	// Brief visual flash on the pad you pressed (purely local feedback).
	let flash = $state<Side | null>(null);

	function stroke(side: Side) {
		if (disabled) return;
		onPaddle(side);
		flash = side;
		setTimeout(() => {
			if (flash === side) flash = null;
		}, 90);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.repeat) return; // ignore auto-repeat from holding a key down
		if (e.key === 'ArrowLeft') stroke('L');
		else if (e.key === 'ArrowRight') stroke('R');
	}}
/>

<div class="pads">
	<button
		class="pad left"
		class:flash={flash === 'L'}
		{disabled}
		onpointerdown={(e) => {
			e.preventDefault(); // fire instantly on touch; no focus/scroll delay
			stroke('L');
		}}
	>
		◀<small>LEFT</small>
	</button>
	<button
		class="pad right"
		class:flash={flash === 'R'}
		{disabled}
		onpointerdown={(e) => {
			e.preventDefault();
			stroke('R');
		}}
	>
		▶<small>RIGHT</small>
	</button>
</div>
