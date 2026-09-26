import { botTrapField, parseEnquiry, type Enquiry } from './enquiry';

/** The Enquiry Function's secrets. They're set on the Production environment only; see issue 08. */
export interface EnquiryEnv {
	RESEND_API_KEY?: string;
	TURNSTILE_SECRET_KEY?: string;
	ENQUIRY_TO?: string;
}

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const json = (status: number, body: object) => Response.json(body, { status });

/** Asks Turnstile whether the token came from a human. */
async function isHuman(secret: string, token: string, fetch: Fetch) {
	const body = new FormData();
	body.append('secret', secret);
	body.append('response', token);
	const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
	const outcome: { success?: boolean } = await response.json();
	return outcome.success === true;
}

/**
 * Sends the Enquiry to Piyush as plain text through Resend. Without a verified domain, Resend sends
 * from its own address and only to the account's address, which is the Enquiry recipient.
 */
function send(enquiry: Enquiry, apiKey: string, to: string, fetch: Fetch) {
	return fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
		body: JSON.stringify({
			from: 'Portfolio Enquiries <onboarding@resend.dev>',
			to: [to],
			reply_to: enquiry.email,
			subject: `Portfolio Enquiry (${enquiry.topic}) from ${enquiry.name}`,
			text: `Name: ${enquiry.name}\nEmail: ${enquiry.email}\nTopic: ${enquiry.topic}\n\n${enquiry.message}\n`,
		}),
	});
}

/** Handles POST /api/enquiry: checks the Visitor's input and sends the Enquiry to Piyush. */
export async function handleEnquiry(
	request: Request,
	env: EnquiryEnv,
	fetch: Fetch = (input, init) => globalThis.fetch(input, init),
): Promise<Response> {
	if (request.method !== 'POST') return Response.json({ ok: false, error: 'method-not-allowed' }, { status: 405, headers: { allow: 'POST' } });
	const form = await request.formData().catch(() => undefined);
	if (!form) return json(400, { ok: false, error: 'bad-request' });
	const parsed = parseEnquiry(Object.fromEntries(form));
	if (!parsed.ok) return json(400, { ok: false, errors: parsed.errors });
	if (form.get(botTrapField)) return json(200, { ok: true });
	const { RESEND_API_KEY, TURNSTILE_SECRET_KEY, ENQUIRY_TO } = env;
	if (!RESEND_API_KEY || !TURNSTILE_SECRET_KEY || !ENQUIRY_TO) return json(503, { ok: false, error: 'unavailable' });
	const token = String(form.get('cf-turnstile-response') ?? '');
	const human = token ? await isHuman(TURNSTILE_SECRET_KEY, token, fetch).catch(() => undefined) : false;
	if (human === undefined) return json(502, { ok: false, error: 'not-verified' });
	if (!human) return json(403, { ok: false, error: 'not-verified' });
	const sent = await send(parsed.enquiry, RESEND_API_KEY, ENQUIRY_TO, fetch).catch(() => undefined);
	// Resend's error text can include the recipient's address, so the Visitor gets only a code.
	if (!sent?.ok) return json(502, { ok: false, error: 'not-sent' });
	return json(200, { ok: true });
}
