import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import playwrightConfig from '../../playwright.config';
import { replayLines } from './test-run-replay';

const e2eDir = new URL('../../e2e/', import.meta.url);
const specSources = readdirSync(e2eDir)
	.filter((file) => file.endsWith('.spec.ts'))
	.map((file) => readFileSync(new URL(file, e2eDir), 'utf8'));

/** The source of the test whose title is exactly `title`, from its declaration to the next test. */
function testSource(title: string): string | undefined {
	for (const source of specSources) {
		const start = source.indexOf(`test('${title}'`);
		if (start === -1) continue;
		const next = source.indexOf('\ntest(', start + 1);
		return source.slice(start, next === -1 ? undefined : next);
	}
	return undefined;
}

describe('Home terminal replay', () => {
	it('shows at least one line', () => {
		expect(replayLines.length).toBeGreaterThan(0);
	});

	it.each(replayLines.map((line) => [line.title, line]))('"%s" is a real test in e2e/', (_title, line) => {
		expect(testSource(line.title)).toBeDefined();
	});

	it.each(replayLines.map((line) => [line.title, line]))('"%s" is never skipped', (_title, line) => {
		expect(testSource(line.title)).not.toMatch(/test\.skip\(/);
	});

	it.each(replayLines.map((line) => [line.project, line]))('"%s" is a real Playwright project', (_project, line) => {
		expect(playwrightConfig.projects?.map((project) => project.name)).toContain(line.project);
	});
});
