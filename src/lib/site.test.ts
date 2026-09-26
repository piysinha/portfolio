import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { pageTitle, previewImage } from './site';

describe('pageTitle', () => {
	it('is just the owner name on Home', () => {
		expect(pageTitle()).toBe('Piyush Sinha');
	});

	it('prefixes a named page to the owner name', () => {
		expect(pageTitle('Projects')).toBe('Projects · Piyush Sinha');
	});
});

describe('previewImage', () => {
	it('declares the real size of the rendered PNG', () => {
		const png = readFileSync(new URL(`../../public${previewImage.path}`, import.meta.url));

		expect(png.subarray(1, 4).toString('ascii')).toBe('PNG');
		// IHDR is always the first chunk: width and height are big-endian at bytes 16 and 20.
		expect({ width: png.readUInt32BE(16), height: png.readUInt32BE(20) }).toEqual({
			width: previewImage.width,
			height: previewImage.height,
		});
	});
});
