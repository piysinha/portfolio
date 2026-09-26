import { z } from 'astro/zod';

/** How Projects are grouped on the Projects page, in this order. */
export const projectAreas = ['Test automation', 'Backend', 'Full stack'] as const;

export const projectSchema = z.object({
	title: z.string(),
	summary: z.string(),
	area: z.enum(projectAreas),
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
	/** One short, shareable result for cards, such as "Regression runs: 4 hours → 1.5 hours". */
	highlight: z.string().optional(),
	tags: z.array(z.string()),
	date: z.coerce.date(),
	featured: z.boolean().default(false),
});
