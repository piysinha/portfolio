import { describe, expect, it } from 'vitest';
import { productionHost, shouldCountVisit } from './analytics';

describe('shouldCountVisit', () => {
	it('counts a real Visitor on the live site', () => {
		expect(shouldCountVisit('token', productionHost, false)).toBe(true);
	});

	it('never counts a preview deploy, a local build or an automated test run', () => {
		expect(shouldCountVisit('token', `ab12cd34.${productionHost}`, false)).toBe(false);
		expect(shouldCountVisit('token', 'localhost', false)).toBe(false);
		expect(shouldCountVisit('token', productionHost, true)).toBe(false);
	});

	it('loads nothing until there is a site token', () => {
		expect(shouldCountVisit('', productionHost, false)).toBe(false);
	});
});
