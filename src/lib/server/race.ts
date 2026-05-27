// The kayak race lives entirely in memory in this single Node process. It holds
// one shared RaceState plus a tiny version-counter pub/sub that lets the
// `query.live` generators (one per connected browser) wake up and re-emit
// whenever a command mutates the state.
//
// Nothing here imports from SvelteKit — it's plain TypeScript, easy to read and
// reason about. Living under `$lib/server` guarantees it never reaches the client.

import type { Player, RaceState, Side, Phase } from '$lib/types';

/** Strokes required to cross the finish line. Tune for ~10-15s races. */
const FINISH = 40;

/** Cap the field so lanes don't get too narrow on the big screen. */
const MAX_PLAYERS = 10;

// --- shared state (the single source of truth) ----------------------------
const players = new Map<string, Player>();
let nextLane = 0; // monotonic so lane numbers stay unique even after players leave
let phase: Phase = 'lobby';
let countdown: number | null = null;
let winnerId: string | null = null;
let countdownTimer: ReturnType<typeof setTimeout> | null = null;

// --- version-counter pub/sub ----------------------------------------------
// Every meaningful change bumps `version`. A live generator remembers the last
// version it emitted and sleeps on `changed()` until the next bump. Because the
// generator compares versions *before* sleeping, a change that lands between a
// yield and the next `await changed()` is never missed.
let version = 0;
let waiters: Array<() => void> = [];

export function getVersion(): number {
	return version;
}

/** Resolves the next time `bump()` is called. */
export function changed(): Promise<void> {
	return new Promise((resolve) => waiters.push(resolve));
}

/** Mark the state changed and wake every connected live generator. */
function bump(): void {
	version++;
	const woken = waiters;
	waiters = [];
	for (const resolve of woken) resolve();
}

// Paddles arrive in bursts (a roomful of phones tapping). Collapse them into at
// most one broadcast every ~40ms (~25Hz) so we don't serialize hundreds of
// snapshots a second. Each snapshot is the *full* state, so coalescing is
// lossless — a late tap is simply reflected in the next snapshot.
let bumpScheduled = false;
function scheduleBump(): void {
	if (bumpScheduled) return;
	bumpScheduled = true;
	setTimeout(() => {
		bumpScheduled = false;
		bump();
	}, 40);
}

/** A plain, serializable snapshot for the client. */
export function getState(): RaceState {
	const list = [...players.values()].sort((a, b) => a.lane - b.lane);
	return { phase, players: list, countdown, winnerId, finish: FINISH, max: MAX_PLAYERS, version };
}

// --- mutations (called by the remote commands) ----------------------------

export function join(id: string, name: string): void {
	if (phase !== 'lobby') return; // joining is only allowed before a race starts
	const existing = players.get(id);
	if (existing) {
		existing.name = name; // a refresh/rejoin just updates the name
	} else {
		if (players.size >= MAX_PLAYERS) return; // race is full
		players.set(id, {
			id,
			name,
			lane: nextLane++,
			progress: 0,
			lastSide: null,
			finishedAt: null
		});
	}
	bump();
}

export function startRace(): void {
	if (phase !== 'lobby' || players.size === 0) return;
	phase = 'countdown';
	countdown = 3;
	bump(); // countdown ticks are latency-sensitive — broadcast immediately
	tickCountdown();
}

function tickCountdown(): void {
	countdownTimer = setTimeout(() => {
		if (countdown !== null && countdown > 0) {
			countdown--; // 3 -> 2 -> 1 -> 0 (GO!)
			bump();
			tickCountdown();
		} else {
			phase = 'racing';
			countdown = null;
			bump();
		}
	}, 1000);
}

export function applyPaddle(id: string, side: Side): void {
	if (phase !== 'racing') return;
	const p = players.get(id);
	if (!p || p.finishedAt !== null) return;

	if (p.lastSide !== side) {
		// Alternating stroke — advance.
		p.progress++;
		if (p.progress >= FINISH) {
			p.progress = FINISH;
			p.finishedAt = Date.now();
			if (winnerId === null) {
				winnerId = id;
				phase = 'finished';
				bump(); // someone won — everyone should see it right now
				return;
			}
		}
	}
	// Same side twice => no progress (a stall), but remember the side so the
	// next opposite stroke counts.
	p.lastSide = side;
	scheduleBump();
}

export function newRace(): void {
	if (countdownTimer) {
		clearTimeout(countdownTimer);
		countdownTimer = null;
	}
	for (const p of players.values()) {
		p.progress = 0;
		p.lastSide = null;
		p.finishedAt = null;
	}
	phase = 'lobby';
	countdown = null;
	winnerId = null;
	bump();
}

export function leave(id: string): void {
	if (phase !== 'lobby') return; // you can only bow out before the race starts
	if (players.delete(id)) bump();
}

/** Clear everyone back to an empty lobby (used by the hidden /reset route). */
export function reset(): void {
	if (countdownTimer) {
		clearTimeout(countdownTimer);
		countdownTimer = null;
	}
	players.clear();
	nextLane = 0;
	phase = 'lobby';
	countdown = null;
	winnerId = null;
	bump();
}
