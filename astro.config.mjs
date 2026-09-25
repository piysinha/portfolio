// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Clean URLs without trailing slashes: /projects is built as projects.html, which
	// Cloudflare Pages serves at /projects directly (no redirect).
	build: { format: 'file' },
	trailingSlash: 'never',
});
