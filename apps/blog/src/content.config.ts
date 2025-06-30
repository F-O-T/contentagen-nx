import { defineCollection, z } from "astro:content";

const blog = defineCollection({
   type: "content",
   schema: z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: z.string().optional(),
   }),
});

const changelog = defineCollection({
   type: "content",
   schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      badge: z.string().optional(),
      heroImage: z.string().optional(),
      author: z
         .object({
            name: z.string(),
            role: z.string(),
            initials: z.string(),
         })
         .optional(),
      link: z.string().optional(),
   }),
});

export const collections = { blog, changelog };
