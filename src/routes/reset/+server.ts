// Hidden "magic" route: hit /reset to clear everyone back to an empty lobby.
//
// The clients store their own playerId in sessionStorage, but the server is the
// source of truth — once we clear the player list and bump, every connected live
// query yields the empty state, so everyone reactively drops back to the join
// screen. Their leftover sessionStorage id is harmless; it just lets them rejoin
// with the same identity. (Not secured — fine for a meetup demo.)

import { redirect } from '@sveltejs/kit';
import * as race from '$lib/server/race';

export function GET() {
	race.reset();
	redirect(303, '/');
}
