import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./test/setup.js'],
		exclude: ['test/browser/**', 'node_modules/**'],
	},
});
