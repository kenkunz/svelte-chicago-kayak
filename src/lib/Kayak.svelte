<script lang="ts">
	import type { Side } from '$lib/types';

	let {
		color,
		name,
		mine = false,
		finished = false,
		side = null
	}: {
		color: string;
		name: string;
		mine?: boolean;
		finished?: boolean;
		side?: Side | null;
	} = $props();

	// The paddle dips toward the side you last stroked; the CSS transition below
	// smooths the swing as strokes alternate.
	const angle = $derived(side === 'L' ? -26 : side === 'R' ? 26 : 0);
</script>

<div class="kayak" class:mine class:finished>
	<svg class="boat" viewBox="0 0 100 150" aria-hidden="true">
		<!-- hull, bird's-eye view, bow pointing up (the way it moves) -->
		<path class="hull" d="M50 8 C 67 38 67 112 50 142 C 33 112 33 38 50 8 Z" fill={color} />
		<!-- cockpit where the paddler sits -->
		<ellipse class="cockpit" cx="50" cy="80" rx="8" ry="16" />
		<!-- double-bladed paddle: a blade pokes out each side -->
		<g class="paddle" style="transform: rotate({angle}deg)">
			<rect class="shaft" x="10" y="77" width="80" height="6" rx="3" />
			<ellipse class="blade" cx="12" cy="80" rx="14" ry="8" />
			<ellipse class="blade" cx="88" cy="80" rx="14" ry="8" />
		</g>
	</svg>
	<span class="tag" style="--c: {color}">{name}</span>
</div>

<style>
	.kayak {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 5px;
	}
	.boat {
		width: 80%;
		height: auto;
		display: block;
		overflow: visible; /* don't clip the stroke, paddle swing, or win glow */
	}
	.hull {
		stroke: rgba(0, 0, 0, 0.28);
		stroke-width: 3;
	}
	.cockpit {
		fill: rgba(0, 0, 0, 0.32);
	}
	.paddle {
		transform-box: fill-box;
		transform-origin: center;
		transition: transform 140ms ease;
	}
	.shaft {
		fill: #5a6675;
	}
	.blade {
		fill: #46515f;
	}
	.tag {
		max-width: 96%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-size: 0.85rem;
		font-weight: 800;
		color: #0b2a3a;
		background: #fff;
		border: 2px solid var(--c);
		border-radius: 7px;
		padding: 2px 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
	}
	.kayak.mine .tag {
		background: var(--c);
		color: #fff;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}
	.kayak.mine .hull {
		stroke: #fff;
		stroke-width: 4;
	}
	.kayak.finished .hull {
		filter: drop-shadow(0 0 8px gold);
	}
	@media (prefers-reduced-motion: reduce) {
		.paddle {
			transition: none;
		}
	}
</style>
