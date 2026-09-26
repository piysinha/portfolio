import { expect, test } from '@playwright/test';

// The Enquiry Function over HTTP, on Cloudflare's local server and on the Gate run's preview deploy.
// Each request here stops before any outside call, so none reaches Turnstile or Resend, and they pass
// on a preview that has no secrets. Never tag these @smoke: the Smoke run never submits Enquiries.
test.beforeEach(({}, testInfo) => {
	test.skip(testInfo.project.name !== 'chromium', 'The API needs no browser, so it runs once');
});

test('the Enquiry API rejects invalid input with a message for each field', async ({ request }) => {
	const response = await request.post('/api/enquiry', {
		form: { name: '', email: 'ada', topic: 'Hiring', message: 'Hi there' },
	});

	expect(response.status()).toBe(400);
	expect(await response.json()).toEqual({
		ok: false,
		errors: {
			name: 'Enter your name.',
			email: 'Enter an email address like name@example.com.',
			message: 'Your message must be at least 20 characters.',
		},
	});
});

test('the Enquiry API treats a filled-in bot trap as sent', async ({ request }) => {
	const response = await request.post('/api/enquiry', {
		form: {
			name: 'Spam Bot',
			email: 'bot@example.test',
			topic: 'Something else',
			message: 'Buy followers now at a very low price.',
			website: 'https://spam.example.test',
		},
	});

	expect(response.status()).toBe(200);
	expect(await response.json()).toEqual({ ok: true });
});

test('the Enquiry API accepts only POST', async ({ request }) => {
	const response = await request.get('/api/enquiry');

	expect(response.status()).toBe(405);
	expect(response.headers()['allow']).toBe('POST');
});
