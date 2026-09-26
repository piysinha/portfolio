import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { fakeTurnstile } from './turnstile';

// The Contact page with its backend mocked: /api/enquiry never runs and Turnstile is a stand-in.
// Traces are public, so every address here is a reserved example one.
type Reply = { status: number; json: object };

/** Answers each Enquiry the page sends with the next reply (the last one repeats), and records it. */
async function mockEnquiryApi(page: Page, ...replies: Reply[]) {
	const sent: Record<string, FormDataEntryValue>[] = [];
	await page.route('**/api/enquiry', async (route) => {
		const request = route.request();
		const body = new Response(request.postData(), { headers: { 'content-type': request.headers()['content-type'] } });
		sent.push(Object.fromEntries(await body.formData()));
		const reply = replies[Math.min(sent.length, replies.length) - 1];
		await route.fulfill({ status: reply.status, json: reply.json });
	});
	return sent;
}

const sentReply: Reply = { status: 200, json: { ok: true } };

const message = 'We are hiring an SDET and would like to talk.';

async function fillEnquiry(page: Page) {
	await page.getByLabel('Name', { exact: true }).fill('Ada Lovelace');
	await page.getByLabel('Email', { exact: true }).fill('ada@example.test');
	await page.getByRole('radio', { name: 'Hiring' }).check();
	await page.getByLabel('Message', { exact: true }).fill(message);
}

const sendButton = (page: Page) => page.getByRole('button', { name: 'Send message' });

test('Visitor sends an Enquiry and sees it confirmed', async ({ page }) => {
	await fakeTurnstile(page);
	const sent = await mockEnquiryApi(page, sentReply);
	await page.goto('/contact');

	await fillEnquiry(page);
	await sendButton(page).click();

	await expect(page.getByRole('status')).toHaveText('Thanks, Ada Lovelace. Your message has been sent.');
	expect(sent).toEqual([
		{
			name: 'Ada Lovelace',
			email: 'ada@example.test',
			topic: 'Hiring',
			message,
			referral_code: '',
			'cf-turnstile-response': 'fake-token-1',
		},
	]);
});

test('Visitor is told what to fix, and nothing is sent', async ({ page }) => {
	await fakeTurnstile(page);
	const sent = await mockEnquiryApi(page, sentReply);
	await page.goto('/contact');

	await page.getByLabel('Email', { exact: true }).fill('ada');
	await sendButton(page).click();

	await expect(page.getByLabel('Name', { exact: true })).toBeFocused();
	await expect(page.getByLabel('Name', { exact: true })).toHaveAccessibleDescription('Enter your name.');
	await expect(page.getByLabel('Email', { exact: true })).toHaveAccessibleDescription(
		'Enter an email address like name@example.com.',
	);
	await expect(page.getByRole('group', { name: "What's it about?" })).toHaveAccessibleDescription(
		'Choose what your message is about.',
	);
	await expect(page.getByLabel('Message', { exact: true })).toHaveAccessibleDescription('Enter your message.');
	expect(sent).toEqual([]);
});

test("a failed send keeps the Visitor's message, offers LinkedIn, and can be retried", async ({ page }) => {
	await fakeTurnstile(page);
	const sent = await mockEnquiryApi(page, { status: 502, json: { ok: false, error: 'not-sent' } }, sentReply);
	await page.goto('/contact');
	const status = page.getByRole('status');

	await fillEnquiry(page);
	await sendButton(page).click();

	await expect(status).toContainText("Your message didn't send. Please try again, or message me on LinkedIn");
	await expect(status.getByRole('link', { name: 'LinkedIn (opens in a new tab)' })).toHaveAttribute(
		'href',
		'https://www.linkedin.com/in/piyush-sinha-sdet',
	);
	await expect(page.getByLabel('Message', { exact: true })).toHaveValue(message);

	await sendButton(page).click();

	await expect(status).toHaveText('Thanks, Ada Lovelace. Your message has been sent.');
	expect(sent.map((enquiry) => enquiry['cf-turnstile-response']), 'each try has a fresh token').toEqual([
		'fake-token-1',
		'fake-token-2',
	]);
});

test('Turnstile loads only once the Visitor starts on the form', async ({ page }) => {
	const loads = await fakeTurnstile(page);
	await page.goto('/contact');

	expect(loads, 'nothing loads with the page').toEqual([]);

	await page.getByLabel('Name', { exact: true }).focus();

	await expect.poll(() => loads.length).toBe(1);
});

test('the Turnstile widget fits a small phone without sideways scrolling', async ({ page }) => {
	await page.setViewportSize({ width: 320, height: 640 });
	await fakeTurnstile(page);
	await page.goto('/contact');

	await page.getByLabel('Name', { exact: true }).focus();
	await expect(page.getByTitle('Fake Turnstile widget')).toBeVisible();

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
	expect(overflow).toBe(0);
});

for (const colorScheme of ['light', 'dark'] as const) {
	test(`the form has no accessibility violations while it shows errors in ${colorScheme} theme`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		await fakeTurnstile(page);
		await page.goto('/contact');
		await sendButton(page).click();
		await expect(page.getByLabel('Name', { exact: true })).toHaveAccessibleDescription('Enter your name.');

		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

		expect(results.violations).toEqual([]);
	});
}

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the Visitor is pointed to LinkedIn instead of a form that cannot work', async ({ page }) => {
		await page.goto('/contact');

		await expect(sendButton(page)).toBeHidden();
		await expect(page.getByRole('main').getByRole('link', { name: 'LinkedIn (opens in a new tab)' })).toHaveAttribute(
			'href',
			'https://www.linkedin.com/in/piyush-sinha-sdet',
		);
	});
});
