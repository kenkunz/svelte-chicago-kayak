<script lang="ts">
	import type { RaceState } from '$lib/types';

	let { state, myId }: { state: RaceState; myId: string } = $props();
</script>

<div class="river">
	<div class="finish-line"><span>🏁 FINISH</span></div>
	{#each state.players as player (player.id)}
		{@const frac = Math.min(1, player.progress / state.finish)}
		<div class="lane" class:mine={player.id === myId}>
			<div
				class="kayak"
				class:done={player.finishedAt !== null}
				style="bottom: calc({frac} * (100% - 2.5rem))"
			>
				<span class="boat">🛶</span>
				<span class="tag">{player.name}</span>
			</div>
		</div>
	{/each}
</div>
