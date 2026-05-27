// A stable, vivid color per kayak, derived from the player id so every client
// (and the lobby lineup) renders the same color for the same kayak — no need to
// store it on the server.

export function colorFor(id: string): string {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
	return `hsl(${hash % 360} 75% 55%)`;
}
