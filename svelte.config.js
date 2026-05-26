import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true),

		experimental: {
			async: true
		}
	},

	kit: {
		// adapter-node builds a single long-running Node server (`node build`).
		// That single process is what makes the in-memory race state + live-query
		// broadcast reliable — deployed to Render as one always-on web service.
		adapter: adapter(),

		experimental: {
			remoteFunctions: true
		}
	}
};

export default config;
