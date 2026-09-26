import { describe, expect, it } from 'vitest';
import { parseEnquiry } from './enquiry';

const valid = {
	name: 'Ada Lovelace',
	email: 'ada@example.test',
	topic: 'Hiring',
	message: 'We are hiring an SDET and would like to talk.',
};

describe('parseEnquiry', () => {
	it('accepts a complete Enquiry, trimming stray whitespace', () => {
		const result = parseEnquiry({ ...valid, name: '  Ada Lovelace ', email: ' ada@example.test ' });

		expect(result).toEqual({
			ok: true,
			enquiry: {
				name: 'Ada Lovelace',
				email: 'ada@example.test',
				topic: 'Hiring',
				message: 'We are hiring an SDET and would like to talk.',
			},
		});
	});

	it('asks for every field that is missing or blank', () => {
		expect(parseEnquiry({ name: '   ', message: '' })).toEqual({
			ok: false,
			errors: {
				name: 'Enter your name.',
				email: 'Enter your email address.',
				topic: 'Choose what your message is about.',
				message: 'Enter your message.',
			},
		});
	});

	it.each(['ada', 'ada@example', 'ada @example.test', 'ada@example.test\nBcc: x@example.test', `${'a'.repeat(250)}@example.test`])(
		'rejects %j as an email address',
		(email) => {
			expect(parseEnquiry({ ...valid, email })).toEqual({
				ok: false,
				errors: { email: 'Enter an email address like name@example.com.' },
			});
		},
	);

	it('limits a name to 100 characters', () => {
		expect(parseEnquiry({ ...valid, name: 'a'.repeat(100) }).ok).toBe(true);
		expect(parseEnquiry({ ...valid, name: 'a'.repeat(101) })).toEqual({
			ok: false,
			errors: { name: 'Your name must be 100 characters or fewer.' },
		});
	});

	it('keeps a name on one line, because it goes in the email subject', () => {
		const result = parseEnquiry({ ...valid, name: 'Ada\r\n   Lovelace' });

		expect(result.ok && result.enquiry.name).toBe('Ada Lovelace');
	});

	it('needs a message of 20 to 5,000 characters', () => {
		expect(parseEnquiry({ ...valid, message: 'a'.repeat(20) }).ok).toBe(true);
		expect(parseEnquiry({ ...valid, message: 'a'.repeat(5000) }).ok).toBe(true);
		expect(parseEnquiry({ ...valid, message: 'Hi, call me.' })).toEqual({
			ok: false,
			errors: { message: 'Your message must be at least 20 characters.' },
		});
		expect(parseEnquiry({ ...valid, message: 'a'.repeat(5001) })).toEqual({
			ok: false,
			errors: { message: 'Your message must be 5,000 characters or fewer.' },
		});
	});
});
