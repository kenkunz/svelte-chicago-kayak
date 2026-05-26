# 🛶 Svelte Chicago Kayak Race

A tiny multiplayer game built to demo SvelteKit's new **`query.live`** remote function
at the Svelte Chicago meetup. Everyone joins from their phone, paddles up the Chicago
River by alternating **LEFT/RIGHT**, and the whole room watches the race update in real
time on the big screen. First kayak to the finish wins.

## Why this exists (the talk)

`query.live` gives you **server-pushed, real-time data with no WebSocket/SSE plumbing**.
The entire real-time layer is one async generator that `yield`s state — SvelteKit handles
the streaming connection, SSR, deduplication, and reconnection for you.

The three files worth showing on stage:

| File                                                     | What to point at                                                                                                                                                                                                          |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/routes/race.remote.ts`](src/routes/race.remote.ts) | `raceState = query.live(async function* () { … yield getState() … })`. That's the whole broadcast. No socket setup, subscriber registry, heartbeats, or reconnection code.                                                |
| [`src/routes/+page.svelte`](src/routes/+page.svelte)     | `{@const state = await race}` — fully typed, populated during SSR (no loading flash), and `state` re-renders on every value the server yields. `!race.connected` drives a "Reconnecting…" banner we never had to wire up. |
| [`src/lib/server/race.ts`](src/lib/server/race.ts)       | The shared in-memory state + a small version-counter pub/sub. A `command` mutates state and bumps the version; every connected client's generator wakes and re-emits.                                                     |

**Contrast to make:** with raw WebSockets or SSE you'd hand-write connection setup, a
registry of connected clients, a broadcast loop, teardown, reconnection with backoff, and
an untyped message protocol. Here that's all gone, and the payload is end-to-end typed.

## How it works

- **Shared state** lives in one Node process ([`race.ts`](src/lib/server/race.ts)). Because
  it's a single long-running server (not serverless), the in-memory broadcast "just works"
  with zero external dependencies.
- **`raceState`** (`query.live`) streams the full `RaceState` to every client. Each browser
  runs its own server-side generator; a version counter guarantees no client misses an
  update that lands between a yield and the next wait.
- **`paddle` / `joinRace` / `startRace` / `newRace`** (`command`s) mutate the state and bump
  the version. Rapid paddles are coalesced to ~25 Hz so a roomful of taps stays cheap.
- **Adaptive UI:** big screen / laptop spectators see the full river; laptop players see the
  river + controls; phones become a **controller** (giant LEFT/RIGHT buttons) and watch the
  projector. Pure CSS media queries — no JS viewport sniffing.
- No persistence: state resets if the server restarts. That's fine for a demo.

## Develop

```sh
pnpm install
pnpm dev
```

Open `http://localhost:5173` in a few tabs to see it sync. Type a name to race, or just
watch (spectator). On a laptop you can also paddle with the **arrow keys**.

To test from other devices on your network, run `pnpm dev --host` and open the printed
Network URL (e.g. `http://192.168.x.x:5173`).

## Deploy (Render free tier)

This app uses [`@sveltejs/adapter-node`](https://svelte.dev/docs/kit/adapter-node) and must
run as **one always-on instance** (the shared state lives in process memory — do not enable
autoscaling).

Create a Render **Web Service** from this repo:

- **Build command:** `pnpm install && pnpm build`
- **Start command:** `node build`
- **Environment variable (important):** set
  `ORIGIN=https://<your-service>.onrender.com`. Without it, the `command` POSTs are rejected
  behind Render's proxy (cross-site/forbidden). This is the #1 deploy gotcha.

`PORT` is provided by Render automatically; adapter-node reads it.

### Demo-day checklist

- Render's **free tier spins down after ~15 min idle** (~1 min cold start). **Open the URL a
  couple of minutes before you present** to warm it, and keep a tab open so it stays awake.
- Put the projector/laptop on the page **without joining** — it's a spectator and shows the
  full river.
- Have attendees open the same URL on their phones and enter a name.

## Tech notes

- Requires the experimental flags already set in `svelte.config.js`:
  `kit.experimental.remoteFunctions` and `compilerOptions.experimental.async`.
- Remote-function arguments are validated by hand (`'unchecked'` + small guards) to keep the
  demo dependency-free; in production you'd use a Standard Schema library (Zod/Valibot).
