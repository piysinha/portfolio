import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sectionChecks } from './section-checks';

const e2eDir = new URL('../../e2e/', import.meta.url);

/** The source of the test titled exactly `title` in `spec`, from its declaration to the next test. */
function testSource(spec: string, title: string): string | undefined {
	const source = readFileSync(new URL(spec, e2eDir), 'utf8');
	const start = source.indexOf(`test('${title}'`);
	if (start === -1) return undefined;
	const next = source.indexOf('\ntest(', start + 1);
	return source.slice(start, next === -1 ? undefined : next);
}

const checks = Object.values(sectionChecks).map((check) => [check.title, check] as const);

describe('Section labels', () => {
	it.each(checks)('"%s" is a real test in its spec file', (_title, check) => {
		expect(testSource(check.spec, check.title)).toBeDefined();
	});

	it.each(checks)('"%s" is never skipped', (_title, check) => {
		expect(testSource(check.spec, check.title)).not.toMatch(/test\.skip\(/);
	});
});
