import { describe, expect, it } from 'vitest';
import { displayDate, isoDate, newestFirst } from './dates';

describe('dates', () => {
	it('shows a month and year, the same in every browser', () => {
		expect(displayDate(new Date('2026-09-26'))).toBe('Sep 2026');
		expect(displayDate(new Date('2024-01-01'))).toBe('Jan 2024');
	});

	it('gives a machine-readable date for <time datetime>', () => {
		expect(isoDate(new Date('2026-09-26'))).toBe('2026-09-26');
	});

	it('sorts entries newest first without changing the input', () => {
		const entries = [{ data: { date: new Date('2024-04-16') } }, { data: { date: new Date('2026-02-02') } }];

		expect(newestFirst(entries).map((entry) => isoDate(entry.data.date))).toEqual(['2026-02-02', '2024-04-16']);
		expect(isoDate(entries[0].data.date)).toBe('2024-04-16');
	});
});
