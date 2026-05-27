<script lang="ts">
	import type { RaceState } from '$lib/types';
	import Kayak from '$lib/Kayak.svelte';

	let { state, myId }: { state: RaceState; myId: string } = $props();

	// A stable, vivid color per kayak, derived from the player id so every client
	// renders the same color for the same kayak (no need to store it on the server).
	function colorFor(id: string): string {
		let hash = 0;
		for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
		return `hsl(${hash % 360} 75% 55%)`;
	}
</script>

<div class="river">
	<div class="finish-line"><span>🏁 FINISH</span></div>
	{#each state.players as player (player.id)}
		{@const frac = Math.min(1, player.progress / state.finish)}
		<div class="lane" class:mine={player.id === myId}>
			<div class="kayak-pos" style="bottom: calc({frac} * (100% - 150px))">
				<Kayak
					color={colorFor(player.id)}
					name={player.name}
					mine={player.id === myId}
					finished={player.finishedAt !== null}
					side={player.lastSide}
				/>
			</div>
		</div>
	{/each}
</div>
