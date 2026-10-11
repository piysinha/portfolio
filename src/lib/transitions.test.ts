import { describe, expect, it } from 'vitest';
import { transitionName } from './transitions';

describe('transitionName', () => {
	it('gives a card and its page the same CSS identifier', () => {
		expect(transitionName('/projects/this-portfolio')).toBe('entry-projects-this-portfolio');
	});

	it('keeps Projects and Case studies with the same slug apart', () => {
		expect(transitionName('/projects/chess')).not.toBe(transitionName('/case-studies/chess'));
	});
});
