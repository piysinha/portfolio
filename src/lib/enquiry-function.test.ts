import { describe, expect, it } from 'vitest';
import { handleEnquiry, type EnquiryEnv } from './enquiry-function';

// API tests for the Enquiry Function, run in-process. Turnstile and Resend are faked at the HTTP
// boundary, so no test calls the real services, and every address is a reserved example one.
const env: EnquiryEnv = {
	RESEND_API_KEY: 're_test_key',
	TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
	ENQUIRY_TO: 'piyush@example.test',
};

/** The token Turnstile's test site keys produce. */
const humanToken = 'XXXX.DUMMY.TOKEN.XXXX';

const visitorForm = (overrides: Record<string, string> = {}) => ({
	name: 'Ada Lovelace',
	email: 'ada@example.test',
	topic: 'Hiring',
	message: 'We are hiring an SDET and would like to talk.',
	website: '',
	'cf-turnstile-response': humanToken,
	...overrides,
});

const post = (fields: Record<string, string>) => {
	const body = new FormData();
	for (const [name, value] of Object.entries(fields)) body.append(name, value);
	return new Request('https://portfolio.example.test/api/enquiry', { method: 'POST', body });
};

type ResendReply = { status: number; body: object } | 'unreachable';

/**
 * Stands in for the network. Turnstile passes only this env's secret with the human token; Resend
 * accepts only this env's key, then records the email Piyush would receive.
 */
function fakeServices({
	turnstile = 'up' as 'up' | 'unreachable',
	resend = { status: 200, body: { id: 'email-1' } } as ResendReply,
} = {}) {
	const calls: string[] = [];
	const inbox: unknown[] = [];
	const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const request = new Request(input, init);
		calls.push(request.url);
		if (request.url === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
			if (turnstile === 'unreachable') throw new TypeError('Network connection lost');
			const { secret, response } = Object.fromEntries(await request.formData());
			const success = secret === env.TURNSTILE_SECRET_KEY && response === humanToken;
			return Response.json({ success, 'error-codes': success ? [] : ['invalid-input-response'] });
		}
		if (request.url === 'https://api.resend.com/emails') {
			if (resend === 'unreachable') throw new TypeError('Network connection lost');
			if (request.headers.get('authorization') !== `Bearer ${env.RESEND_API_KEY}`)
				return Response.json({ name: 'validation_error', message: 'API key is invalid' }, { status: 401 });
			if (resend.status === 200) inbox.push(await request.json());
			return Response.json(resend.body, { status: resend.status });
		}
		throw new Error(`Unexpected request to ${request.url}`);
	};
	return { fetch, calls, inbox };
}

describe('the Enquiry Function', () => {
	it('sends a valid Enquiry to Piyush, so that Reply goes to the Visitor', async () => {
		const services = fakeServices();

		const response = await handleEnquiry(post(visitorForm()), env, services.fetch);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(services.inbox).toEqual([
			{
				from: 'Portfolio Enquiries <onboarding@resend.dev>',
				to: ['piyush@example.test'],
				reply_to: 'ada@example.test',
				subject: 'Portfolio Enquiry (Hiring) from Ada Lovelace',
				text: 'Name: Ada Lovelace\nEmail: ada@example.test\nTopic: Hiring\n\nWe are hiring an SDET and would like to talk.\n',
			},
		]);
	});

	it('rejects invalid input with a message for each field, before calling any service', async () => {
		const services = fakeServices();

		const response = await handleEnquiry(post(visitorForm({ email: 'ada', message: '' })), env, services.fetch);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			ok: false,
			errors: { email: 'Enter an email address like name@example.com.', message: 'Enter your message.' },
		});
		expect(services.calls).toEqual([]);
	});

	it('treats a filled-in bot trap as sent, but sends nothing and calls no service', async () => {
		const services = fakeServices();

		const response = await handleEnquiry(post(visitorForm({ website: 'https://spam.example.test' })), env, services.fetch);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ ok: true });
		expect(services.calls).toEqual([]);
	});

	it('sends nothing when Turnstile rejects the token', async () => {
		const services = fakeServices();

		const response = await handleEnquiry(post(visitorForm({ 'cf-turnstile-response': 'forged-token' })), env, services.fetch);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ ok: false, error: 'not-verified' });
		expect(services.inbox).toEqual([]);
	});

	it('rejects a missing Turnstile token without calling any service', async () => {
		const services = fakeServices();

		const response = await handleEnquiry(post(visitorForm({ 'cf-turnstile-response': '' })), env, services.fetch);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ ok: false, error: 'not-verified' });
		expect(services.calls).toEqual([]);
	});

	it("reports a Resend failure without passing on Resend's error, which can name the recipient", async () => {
		const resendError = {
			name: 'validation_error',
			message: 'You can only send testing emails to your own email address (piyush@example.test).',
		};
		const services = fakeServices({ resend: { status: 403, body: resendError } });

		const response = await handleEnquiry(post(visitorForm()), env, services.fetch);
		const body = await response.text();

		expect(response.status).toBe(502);
		expect(JSON.parse(body)).toEqual({ ok: false, error: 'not-sent' });
		expect(body).not.toContain('piyush@example.test');
	});

	it('reports an unreachable Resend as not sent', async () => {
		const services = fakeServices({ resend: 'unreachable' });

		const response = await handleEnquiry(post(visitorForm()), env, services.fetch);

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ ok: false, error: 'not-sent' });
	});

	it.each(['RESEND_API_KEY', 'TURNSTILE_SECRET_KEY', 'ENQUIRY_TO'] as const)(
		'is unavailable, calling no service, when %s is not set',
		async (secret) => {
			const services = fakeServices();

			const response = await handleEnquiry(post(visitorForm()), { ...env, [secret]: '' }, services.fetch);

			expect(response.status).toBe(503);
			expect(await response.json()).toEqual({ ok: false, error: 'unavailable' });
			expect(services.calls).toEqual([]);
		},
	);

	it('sends nothing when Turnstile cannot be reached', async () => {
		const services = fakeServices({ turnstile: 'unreachable' });

		const response = await handleEnquiry(post(visitorForm()), env, services.fetch);

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({ ok: false, error: 'not-verified' });
		expect(services.inbox).toEqual([]);
	});

	it('accepts only POST', async () => {
		const services = fakeServices();

		const response = await handleEnquiry(new Request('https://portfolio.example.test/api/enquiry'), env, services.fetch);

		expect(response.status).toBe(405);
		expect(response.headers.get('allow')).toBe('POST');
		expect(services.calls).toEqual([]);
	});

	it('rejects a body that is not a form', async () => {
		const services = fakeServices();
		const request = new Request('https://portfolio.example.test/api/enquiry', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(visitorForm()),
		});

		const response = await handleEnquiry(request, env, services.fetch);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ ok: false, error: 'bad-request' });
		expect(services.calls).toEqual([]);
	});
});
