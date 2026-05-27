<script lang="ts">
	import { browser } from '$app/environment';
	import { raceState, joinRace, leaveRace, startRace, paddle, newRace } from './race.remote';
	import { getPlayerId } from '$lib/identity';
	import type { Side } from '$lib/types';
	import Lobby from '$lib/Lobby.svelte';
	import RaceView from '$lib/RaceView.svelte';
	import Controller from '$lib/Controller.svelte';

	// A stable per-tab id, generated on the client and sent with commands.
	const playerId = browser ? getPlayerId() : '';

	// ONE live query, created here and consumed in the template below. Creating it
	// in the component "anchors" it to a reactive context, so the stream stays open
	// while the page is mounted and is torn down automatically when it isn't.
	const race = raceState();

	// Reading `race.connected` inside the awaited markup below would lose reactivity
	// (it'd be read after `await race`), so we derive it up here instead. `.current`
	// is the last received value — defined once we've connected at least once (and
	// retained during a reconnect), so the banner doesn't flash on the first load.
	const reconnecting = $derived(race.current != null && !race.connected);

	// Fire-and-forget: never await in the tap handler, or strokes would queue up.
	function handlePaddle(side: Side) {
		paddle({ playerId, side });
	}
</script>

{#if reconnecting}
	<!-- `.connected` + auto-reconnect are built in; we wrote zero reconnection logic. -->
	<div class="reconnecting">Reconnecting…</div>
{/if}

<svelte:boundary>
	{#snippet failed(error: unknown, reset: () => void)}
		<div class="loading">
			<p>Lost the river ({error instanceof Error ? error.message : 'connection error'}).</p>
			<button onclick={reset}>Try again</button>
		</div>
	{/snippet}

	<!-- `await race` resolves to the latest RaceState and re-renders on every new
	     value the server yields. Fully typed, populated during SSR (no loading
	     flash), and shared across every use on the page. This is the demo. -->
	{@const state = await race}
	{@const me = state.players.find((p) => p.id === playerId)}

	<main>
		{#if state.phase === 'lobby'}
			<Lobby
				{state}
				{me}
				onJoin={(name) => joinRace({ playerId, name })}
				onStart={() => startRace()}
				onLeave={() => leaveRace({ playerId })}
			/>
		{:else}
			<div class="race-screen" class:playing={!!me}>
				<div class="river-wrap">
					<RaceView {state} myId={playerId} />

					{#if state.phase === 'countdown'}
						<div class="overlay countdown">{state.countdown === 0 ? 'GO!' : state.countdown}</div>
					{:else if state.phase === 'finished'}
						{@const winner = state.players.find((p) => p.id === state.winnerId)}
						<div class="overlay winner">🏆 {winner?.name ?? 'Someone'} wins!</div>
					{/if}
				</div>

				{#if me}
					<div class="dock">
						<div class="phone-status">
							{#if state.phase === 'countdown'}
								<span class="big">{state.countdown === 0 ? 'GO!' : state.countdown}</span>
							{:else if state.phase === 'finished'}
								<span class="big">{state.winnerId === me.id ? '🏆 You win!' : 'Race over'}</span>
							{:else}
								<span class="big">{Math.round((me.progress / state.finish) * 100)}%</span>
								<span class="hint">alternate the paddles!</span>
							{/if}
						</div>
						<Controller disabled={state.phase !== 'racing'} onPaddle={handlePaddle} />
					</div>
				{/if}

				{#if state.phase === 'finished'}
					<button class="new-race" onclick={() => newRace()}>New race</button>
				{/if}
			</div>
		{/if}
	</main>
</svelte:boundary>
