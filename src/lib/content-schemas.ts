import { z } from 'astro/zod';

export const projectSchema = z.object({
	title: z.string(),
	summary: z.string(),
	tags: z.array(z.string()),
	repo: z.url(),
	live: z.url().optional(),
	date: z.coerce.date(),
	featured: z.boolean().default(false),
});

// Strict: unknown fields fail the build. There is deliberately no client or employer
// field, so employer work can only ever appear anonymised.
export const caseStudySchema = z.strictObject({
	title: z.string(),
	problem: z.string(),
	approach: z.string(),
	outcome: z.string(),
	tags: z.array(z.string()),
	date: z.coerce.date(),
	featured: z.boolean().default(false),
});
