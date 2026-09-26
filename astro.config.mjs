// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import { defineConfig } from 'astro/config';

/** Links to other websites in Markdown content open in a new tab, matching ExternalLink.astro. */
const externalLinks = {
	name: 'external-links',
	element: {
		filter: ['a'],
		/** @param {any} node @param {any} ctx */
		visit(node, ctx) {
			if (!/^https?:\/\//.test(String(node.properties?.href ?? ''))) return;
			ctx.setProperty(node, 'target', '_blank');
			ctx.setProperty(node, 'rel', ['noopener', 'noreferrer']);
			ctx.appendChild(node, [
				{
					type: 'element',
					tagName: 'span',
					properties: { className: ['sr-only'] },
					children: [{ type: 'text', value: ' (opens in a new tab)' }],
				},
				{
					type: 'element',
					tagName: 'span',
					properties: { className: ['external-icon'], ariaHidden: 'true' },
					children: [{ type: 'text', value: '↗' }],
				},
			]);
		},
	},
};

// https://astro.build/config
export default defineConfig({
	// Clean URLs without trailing slashes: /projects is built as projects.html, which
	// Cloudflare Pages serves at /projects directly (no redirect).
	build: { format: 'file' },
	trailingSlash: 'never',
	markdown: { processor: satteri({ hastPlugins: [externalLinks] }) },
});
