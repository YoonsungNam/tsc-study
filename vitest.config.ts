import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Separate from `vite.config.ts` so test runs don't pull in the full
 * SvelteKit plugin chain (which assumes a server/build context). For the
 * unit-test layer we just need the `$lib` alias and a Node environment.
 *
 * Component tests (later, once we add Svelte 5 component coverage) can be
 * scoped via additional includes or a second vitest project.
 *
 * Use `import.meta.dirname` (Node 20.11+, we're on 22) to resolve `$lib`
 * against this config file's directory rather than `process.cwd()`. The
 * latter would break if vitest is invoked from a subdirectory.
 */
export default defineConfig({
	resolve: {
		alias: {
			$lib: path.resolve(import.meta.dirname, 'src/lib')
		}
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node',
		globals: false
	}
});
