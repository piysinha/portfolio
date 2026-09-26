/** What a Visitor can say an Enquiry is about, matching the three kinds of Visitor. */
export const topics = ['Hiring', 'Freelance project', 'Something else'] as const;
export type Topic = (typeof topics)[number];

/** A validated Enquiry, as the contact form sends it. */
export interface Enquiry {
	name: string;
	email: string;
	topic: Topic;
	message: string;
}

export type EnquiryErrors = Partial<Record<keyof Enquiry, string>>;

export type ParsedEnquiry = { ok: true; enquiry: Enquiry } | { ok: false; errors: EnquiryErrors };

/** A form field hidden from people. Bots that fill it in are told their Enquiry was sent. */
export const botTrapField = 'referral_code';

/** Length limits, also used for the form's own attributes. */
export const limits = { name: 100, email: 254, message: { min: 20, max: 5000 } } as const;

/** One address, no spaces or line breaks, with a dot in the domain. Deliverability is Resend's job. */
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

/** Checks a Visitor's form input. The Contact page and the Enquiry Function share it, so their messages match. */
export function parseEnquiry(fields: Record<string, unknown>): ParsedEnquiry {
	const enquiry = {
		name: text(fields.name).replace(/\s+/g, ' '),
		email: text(fields.email),
		topic: text(fields.topic) as Topic,
		message: text(fields.message),
	};
	const errors: EnquiryErrors = {};
	if (!enquiry.name) errors.name = 'Enter your name.';
	else if (enquiry.name.length > limits.name) errors.name = `Your name must be ${limits.name} characters or fewer.`;
	if (!enquiry.email) errors.email = 'Enter your email address.';
	else if (enquiry.email.length > limits.email || !emailPattern.test(enquiry.email))
		errors.email = 'Enter an email address like name@example.com.';
	if (!topics.includes(enquiry.topic)) errors.topic = 'Choose what your message is about.';
	if (!enquiry.message) errors.message = 'Enter your message.';
	else if (enquiry.message.length < limits.message.min)
		errors.message = `Your message must be at least ${limits.message.min} characters.`;
	else if (enquiry.message.length > limits.message.max)
		errors.message = `Your message must be ${limits.message.max.toLocaleString('en-GB')} characters or fewer.`;
	return Object.keys(errors).length ? { ok: false, errors } : { ok: true, enquiry };
}
