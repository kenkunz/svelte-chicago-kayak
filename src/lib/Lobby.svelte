<script lang="ts">
	import type { Player, RaceState } from '$lib/types';

	// Aliased to `game` because the `$state` rune below can't coexist with a
	// variable literally named `state` (Svelte would read `$state` as a store).
	let {
		state: game,
		me,
		onJoin,
		onStart
	}: {
		state: RaceState;
		me: Player | undefined;
		onJoin: (name: string) => void;
		onStart: () => void;
	} = $props();

	let name = $state('');

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const trimmed = name.trim();
		if (trimmed) {
			onJoin(trimmed);
			name = '';
		}
	}
</script>

<div class="lobby">
	<h1>🛶 Svelte Chicago Kayak Race</h1>
	<p class="tagline">
		Paddle up the Chicago River — alternate <kbd>◀</kbd> and <kbd>▶</kbd> as fast as you can. First kayak
		to the finish wins!
	</p>

	<div class="roster">
		<h2>In the water ({game.players.length})</h2>
		{#if game.players.length === 0}
			<p class="empty">No kayaks yet — be the first to launch!</p>
		{:else}
			<ul>
				{#each game.players as p (p.id)}
					<li class:mine={p.id === me?.id}>🛶 {p.name}{p.id === me?.id ? ' (you)' : ''}</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if me}
		<p class="ready">You're in as <strong>{me.name}</strong>. Waiting for racers to line up…</p>
	{:else}
		<form class="join-form" onsubmit={submit}>
			<input
				type="text"
				placeholder="Enter your name"
				maxlength="20"
				autocomplete="off"
				bind:value={name}
			/>
			<button type="submit" disabled={!name.trim()}>Join</button>
		</form>
	{/if}

	{#if game.players.length > 0}
		<button class="start-btn" onclick={onStart}>Start race</button>
	{/if}
</div>
