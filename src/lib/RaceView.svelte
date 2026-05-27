<script lang="ts">
	import type { RaceState } from '$lib/types';
	import Kayak from '$lib/Kayak.svelte';
	import { colorFor } from '$lib/colors';

	let { state, myId }: { state: RaceState; myId: string } = $props();
</script>

<div class="river">
	<div class="finish-line"><span>🏁 FINISH</span></div>
	{#each state.players as player (player.id)}
		{@const frac = Math.min(1, player.progress / state.finish)}
		<div class="lane" class:mine={player.id === myId}>
			<div class="kayak-pos" style="bottom: calc({frac} * (100% - 258px))">
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
