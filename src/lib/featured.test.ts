import { describe, expect, it } from 'vitest';
import { featuredWork } from './featured';

const project = (id: string, date: string, featured: boolean) => ({
	id,
	data: { title: `Project ${id}`, summary: `Summary ${id}`, tags: ['Playwright'], date: new Date(date), featured },
});

const caseStudy = (id: string, date: string, featured: boolean) => ({
	id,
	data: { title: `Case study ${id}`, problem: `Problem ${id}`, tags: ['CI'], date: new Date(date), featured },
});

describe('featuredWork', () => {
	it('keeps only featured entries from both collections, newest first', () => {
		const work = featuredWork(
			[project('old', '2024-01-01', true), project('hidden', '2026-01-01', false)],
			[caseStudy('new', '2025-06-01', true), caseStudy('skip', '2025-07-01', false)],
		);

		expect(work.map((item) => item.title)).toEqual(['Case study new', 'Project old']);
	});

	it('labels each entry with its kind and links to its detail page', () => {
		const [first, second] = featuredWork([project('site', '2026-09-26', true)], [caseStudy('flaky', '2025-01-01', true)]);

		expect(first).toMatchObject({ kind: 'Project', href: '/projects/site', summary: 'Summary site' });
		expect(second).toMatchObject({ kind: 'Case study', href: '/case-studies/flaky', summary: 'Problem flaky' });
	});

	it('is empty when nothing is featured', () => {
		expect(featuredWork([project('a', '2026-01-01', false)], [])).toEqual([]);
	});
});
