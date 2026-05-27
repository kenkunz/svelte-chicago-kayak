// Shared types for the kayak race. Kept in a neutral (non-server) module so that
// Svelte components can `import type` them without reaching into `$lib/server`.

export type Side = 'L' | 'R';

export type Phase = 'lobby' | 'countdown' | 'racing' | 'finished';

export interface Player {
	id: string;
	name: string;
	lane: number;
	/** Counted strokes, 0..FINISH. */
	progress: number;
	/** Last side paddled; used to enforce the alternating rule. */
	lastSide: Side | null;
	/** Timestamp (ms) when this kayak crossed the line, else null. */
	finishedAt: number | null;
}

export interface RaceState {
	phase: Phase;
	players: Player[];
	/** 3 | 2 | 1 | 0 (GO!) while counting down, otherwise null. */
	countdown: number | null;
	winnerId: string | null;
	/** Strokes needed to win — lets the client size the river. */
	finish: number;
	/** Max players allowed (the field is capped so lanes stay legible). */
	max: number;
	/** Increments on every change; handy for debugging the live stream. */
	version: number;
}
