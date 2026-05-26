// Each browser tab gets a stable id, generated on the client and sent with the
// join/paddle commands so the server knows which kayak is yours. It's kept in
// sessionStorage so a refresh rejoins the same kayak. It's just a tab id, not a
// secret, so a short random string is plenty.

const KEY = 'kayak-player-id';

export function getPlayerId(): string {
	if (typeof window === 'undefined') return ''; // never called during SSR
	let id = sessionStorage.getItem(KEY);
	if (!id) {
		id = Math.random().toString(36).slice(2);
		sessionStorage.setItem(KEY, id);
	}
	return id;
}
