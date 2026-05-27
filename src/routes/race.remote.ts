// =============================================================================
// This file is the whole real-time story. Compare it to a WebSocket or SSE
// implementation, which would need: connection setup, a registry of subscribers,
// heartbeats, manual broadcast, teardown, reconnection logic, and a hand-written
// (untyped) message protocol. None of that is here.
//
//   • `raceState` is a `query.live` — an async generator that simply `yield`s the
//     state. SvelteKit streams each yielded value to every connected client over
//     a single long-lived HTTP connection. It handles SSR (the first value is
//     serialized into the page, so there's no loading flash), de-dupes multiple
//     uses onto one connection, and auto-reconnects with backoff. The value is
//     fully typed end to end — no JSON.parse, no schema duplication.
//
//   • the commands (`joinRace`, `paddle`, …) mutate the shared in-memory state
//     and bump a version counter; every live generator wakes and re-emits. That
//     is the entire broadcast mechanism.
// =============================================================================

import { query, command } from '$app/server';
import * as race from '$lib/server/race';
import type { Side } from '$lib/types';

// --- manual argument validation -------------------------------------------
// Remote functions are public HTTP endpoints, so arguments must be validated. In
// production you'd pass a Standard Schema (Zod/Valibot); to keep this demo
// dependency-free we use `'unchecked'` plus these hand-written guards.
const MAX_NAME = 20;

function cleanName(value: unknown): string {
	if (typeof value !== 'string') throw new Error('name must be a string');
	// Collapse whitespace, trim, and cap the length. (Svelte auto-escapes text,
	// so there's no HTML-injection concern with what a player types as a name.)
	const name = value.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
	if (!name) throw new Error('name is required');
	return name;
}

function asId(value: unknown): string {
	if (typeof value !== 'string' || value.length < 1 || value.length > 64) {
		throw new Error('invalid player id');
	}
	return value;
}

function asSide(value: unknown): Side {
	if (value !== 'L' && value !== 'R') throw new Error('invalid side');
	return value;
}

// --- the live query: real-time race state for every client -----------------
export const raceState = query.live(async function* () {
	let lastSeen = -1;
	try {
		while (true) {
			// Emit only when something actually changed. Reading the version
			// *before* awaiting guarantees we never miss a change that landed
			// between the previous yield and arriving here.
			const version = race.getVersion();
			if (version !== lastSeen) {
				lastSeen = version;
				yield race.getState();
			}
			await race.changed(); // sleep until the next bump()
		}
	} finally {
		// Runs when the browser disconnects (SvelteKit calls the iterator's
		// return()). This `finally` is the *only* connection-lifecycle code we
		// write — there's no socket to close and no subscriber to unregister.
	}
});

// --- commands: mutate state; the live stream carries the result ------------
// Note: live queries have no `.refresh()` (they're self-updating) and we don't
// need single-flight `.reconnect()` here — mutating the shared state + bump()
// already pushes the new state down every open stream.

export const joinRace = command('unchecked', async (input: unknown) => {
	const { playerId, name } = (input ?? {}) as { playerId?: unknown; name?: unknown };
	race.join(asId(playerId), cleanName(name));
});

export const leaveRace = command('unchecked', async (input: unknown) => {
	const { playerId } = (input ?? {}) as { playerId?: unknown };
	race.leave(asId(playerId));
});

export const startRace = command(async () => {
	race.startRace();
});

export const paddle = command('unchecked', async (input: unknown) => {
	const { playerId, side } = (input ?? {}) as { playerId?: unknown; side?: unknown };
	race.applyPaddle(asId(playerId), asSide(side));
});

export const newRace = command(async () => {
	race.newRace();
});
