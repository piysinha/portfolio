/**
 * Renders the link preview image (public/og-image.png) that X, LinkedIn and other sites show when a
 * link to the site is shared. Its text comes from the site's own code, so it can't drift: the name
 * and role from `owner`, real test titles from the Home replay, and the count-free release line.
 *
 * Usage: npm run render:preview-image
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { guaranteedCheck } from '../src/lib/release-check.ts';
import { owner, previewImage } from '../src/lib/site.ts';
import { replayLines } from '../src/lib/test-run-replay.ts';

const root = new URL('../', import.meta.url);
const out = fileURLToPath(new URL(`public${previewImage.path}`, root));

/** A font file from node_modules as a data URL, so the page needs no file or network access. */
const font = (file: string) =>
	`data:font/woff2;base64,${readFileSync(new URL(`node_modules/@fontsource-variable/${file}`, root)).toString('base64')}`;

const escape = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The three shortest replay titles: at timeline size, long lines only turn into texture.
const lines = [...replayLines].sort((a, b) => a.title.length - b.title.length).slice(0, 3);
const [first, ...rest] = owner.name.split(' ');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
	@font-face {
		font-family: 'Archivo';
		font-weight: 100 900;
		font-stretch: 62% 125%;
		src: url(${font('archivo/files/archivo-latin-wdth-normal.woff2')}) format('woff2-variations');
	}
	@font-face {
		font-family: 'JetBrains Mono';
		font-weight: 100 800;
		src: url(${font('jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2')}) format('woff2-variations');
	}
	* { box-sizing: border-box; margin: 0; padding: 0; }
	html, body { width: ${previewImage.width}px; height: ${previewImage.height}px; }
	/* The site's dark theme and terminal colours (src/styles/global.css, TestRunReplay.astro). */
	body {
		display: grid;
		grid-template-columns: 1fr 500px;
		gap: 44px;
		align-items: center;
		padding: 0 64px 36px 76px;
		overflow: hidden;
		background:
			radial-gradient(circle at 88% 12%, rgb(35 44 120 / 0.55), transparent 55%),
			#0c1024;
		color: #e8eaf6;
		font-family: 'Archivo', sans-serif;
	}
	.name {
		font-size: 132px;
		font-stretch: 122%;
		font-weight: 800;
		letter-spacing: -0.025em;
		line-height: 0.92;
	}
	.role {
		margin-top: 34px;
		color: #9eabff;
		font-size: 34px;
		white-space: nowrap;
		font-stretch: 110%;
		font-weight: 700;
	}
	.intro {
		margin-top: 18px;
		max-width: 16em;
		font-size: 31px;
		line-height: 1.28;
	}
	.term {
		overflow: hidden;
		border-radius: 22px;
		background: #060919;
		box-shadow: 0 0 0 1px #283056;
		color: #e6e9f7;
		font-family: 'JetBrains Mono', monospace;
		font-size: 17px;
		line-height: 1.5;
	}
	.bar {
		display: flex;
		gap: 8px;
		padding: 16px 20px;
		border-bottom: 1px solid rgb(255 255 255 / 0.09);
	}
	.bar i { width: 13px; height: 13px; border-radius: 50%; background: rgb(255 255 255 / 0.18); }
	.body { display: grid; gap: 12px; padding: 22px 26px 28px; }
	.prompt { color: #a8b3ff; }
	ol { display: grid; gap: 10px; list-style: none; }
	li { display: grid; grid-template-columns: 26px 1fr; }
	.ok { color: #62d38e; }
	.summary { margin-top: 4px; padding-top: 16px; border-top: 1px dashed rgb(255 255 255 / 0.09); }
	.result { font-weight: 700; }
	.release { color: #939ac2; }
</style>
</head>
<body>
	<div>
		<p class="name">${escape(first)}<br>${escape(rest.join(' '))}</p>
		<p class="role">${escape(owner.role)}</p>
		<p class="intro">Playwright and TypeScript test automation for web apps and APIs.</p>
	</div>
	<div class="term">
		<div class="bar"><i></i><i></i><i></i></div>
		<div class="body">
			<p><span class="prompt">$</span> npx playwright test</p>
			<ol>
				${lines.map(({ title }) => `<li><span class="ok">✓</span><span>${escape(title)}</span></li>`).join('\n\t\t\t\t')}
			</ol>
			<div class="summary">
				<p class="result">${escape(guaranteedCheck.result)}</p>
				<p class="release">${escape(guaranteedCheck.release)}</p>
			</div>
		</div>
	</div>
</body>
</html>`;

const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: previewImage.width, height: previewImage.height },
		deviceScaleFactor: 1,
	});
	await page.setContent(html);
	// A font that failed to load would silently fall back to a system font, so fail loudly instead.
	const unloaded = await page.evaluate(async () => {
		await document.fonts.ready;
		const faces = [...document.fonts];
		await Promise.all(faces.map((face) => face.load().catch(() => undefined)));
		return faces.filter((face) => face.status !== 'loaded').map((face) => face.family);
	});
	if (unloaded.length > 0) throw new Error(`Fonts did not load: ${unloaded.join(', ')}`);
	await page.screenshot({ path: out });
	console.log(`Wrote ${out}`);
} finally {
	await browser.close();
}
