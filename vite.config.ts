import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),

			// Content-Security-Policy. Tout est interdit par défaut, on ouvre au strict
			// minimum. SvelteKit ajoute automatiquement un nonce à ses propres scripts.
			// => une injection de <script> dans une page ne s'exécute pas.
			csp: {
				mode: 'nonce',
				directives: {
					'default-src': ['none'],
					'script-src': ['self'],
					'style-src': ['self'],
					'style-src-attr': ['unsafe-inline'], // transitions Svelte
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					'connect-src': ['self'],
					'frame-src': ['https://www.google.com'],
					'form-action': ['self'],
					'base-uri': ['none'],
					'object-src': ['none'],
					'frame-ancestors': ['none'],
					'manifest-src': ['self']
				}
			}
		})
	]
});
