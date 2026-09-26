import { describe, expect, it } from 'vitest';
import { caseStudySchema, projectSchema } from './content-schemas';

const validProject = {
	title: 'This portfolio',
	summary: 'The site you are reading, tested on every deploy.',
	area: 'Test automation',
	tags: ['Astro', 'Playwright'],
	repo: 'https://github.com/piysinha/portfolio',
	date: '2026-09-26',
};

const validCaseStudy = {
	title: 'Cutting a flaky suite down to size',
	problem: 'Nightly UI tests failed at random.',
	approach: 'Replaced fixed waits with web-first assertions.',
	outcome: 'Failures dropped to near zero.',
	tags: ['Playwright'],
	date: '2026-05-01',
};

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
	return result.error?.issues.map((issue) => issue.path.join('.')) ?? [];
}

describe('Project', () => {
	it('accepts a complete entry and defaults featured to false', () => {
		const result = projectSchema.safeParse(validProject);

		expect(result.success).toBe(true);
		expect(result.data?.featured).toBe(false);
		expect(result.data?.date).toEqual(new Date('2026-09-26'));
	});

	it('accepts an optional live link', () => {
		expect(projectSchema.safeParse({ ...validProject, live: 'https://example.com' }).success).toBe(true);
	});

	it('rejects an entry without a repo link, naming the field', () => {
		const { repo: _repo, ...withoutRepo } = validProject;

		expect(issuePaths(projectSchema.safeParse(withoutRepo))).toEqual(['repo']);
	});

	it('rejects a repo value that is not a URL', () => {
		expect(issuePaths(projectSchema.safeParse({ ...validProject, repo: 'my repo' }))).toEqual(['repo']);
	});

	it('rejects an area the Projects page does not group by', () => {
		expect(issuePaths(projectSchema.safeParse({ ...validProject, area: 'Design' }))).toEqual(['area']);
	});
});

describe('Case study', () => {
	it('accepts a complete entry', () => {
		expect(caseStudySchema.safeParse(validCaseStudy).success).toBe(true);
	});

	it.each(['problem', 'approach', 'outcome'])('rejects an entry without its %s', (field) => {
		const entry: Record<string, unknown> = { ...validCaseStudy };
		delete entry[field];

		expect(issuePaths(caseStudySchema.safeParse(entry))).toEqual([field]);
	});

	it.each(['client', 'employer'])('rejects a %s field, so employer work stays anonymous', (field) => {
		const result = caseStudySchema.safeParse({ ...validCaseStudy, [field]: 'Some Company' });

		expect(result.success).toBe(false);
		expect(JSON.stringify(result.error?.issues)).toContain(field);
	});
});
