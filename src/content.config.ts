import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).optional(),
    howto: z
      .object({
        name: z.string(),
        steps: z.array(z.object({ name: z.string(), text: z.string() })),
      })
      .optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional().default(''),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    // Opt-in author/trust block. About needs it (YMYL E-E-A-T); Privacy and Terms do not.
    showTrust: z.boolean().default(false),
    trustNote: z.string().optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { blog, pages };
