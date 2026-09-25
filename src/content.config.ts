import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseStudySchema, projectSchema } from './lib/content-schemas';

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: projectSchema,
});

const caseStudies = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/case-studies' }),
	schema: caseStudySchema,
});

export const collections = { projects, caseStudies };
