import { expect, test } from '@playwright/test';
import { productionHost } from '../src/lib/analytics';
import { previewImage } from '../src/lib/site';
import { sitePages } from './site-pages';

for (const target of sitePages) {
	test(`a link to ${target.link} shared on social media shows the preview image`, { tag: '@smoke' }, async ({ page }) => {
		await page.goto(target.path);

		const meta = (key: string) => page.locator(`meta[property="${key}"], meta[name="${key}"]`);
		await expect(meta('og:image')).toHaveAttribute('content', `https://${productionHost}${previewImage.path}`);
		await expect(meta('og:image:width')).toHaveAttribute('content', String(previewImage.width));
		await expect(meta('og:image:height')).toHaveAttribute('content', String(previewImage.height));
		await expect(meta('og:image:alt')).toHaveAttribute('content', previewImage.alt);
		await expect(meta('twitter:card')).toHaveAttribute('content', 'summary_large_image');
		await expect(meta('twitter:image:alt')).toHaveAttribute('content', previewImage.alt);
	});
}

// The tags always point at production, but a Gate run tests a preview that production hasn't caught up
// with yet, so this fetches the image from the site under test. On a Smoke run, that is production.
test('the preview image is served as a PNG', { tag: '@smoke' }, async ({ request }) => {
	const response = await request.get(previewImage.path);

	expect(response.status()).toBe(200);
	expect(response.headers()['content-type']).toBe('image/png');
});
