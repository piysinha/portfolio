/**
 * The test that checks a section of the site, shown as that section's label. section-checks.test.ts
 * fails if a title stops matching a test in its spec file, or if that test can be skipped, so a
 * label never claims a check that doesn't run.
 */
export const sectionChecks = {
	featuredWork: { spec: 'home.spec.ts', title: 'Home features work that opens its own page' },
} as const;

export type SectionCheck = keyof typeof sectionChecks;
