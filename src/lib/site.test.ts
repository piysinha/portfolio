import { describe, expect, it } from 'vitest';
import { pageTitle } from './site';

describe('pageTitle', () => {
	it('is just the owner name on Home', () => {
		expect(pageTitle()).toBe('Piyush Sinha');
	});

	it('prefixes a named page to the owner name', () => {
		expect(pageTitle('Projects')).toBe('Projects · Piyush Sinha');
	});
});
