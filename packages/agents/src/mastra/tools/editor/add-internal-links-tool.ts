import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const AddInternalLinksInputSchema = z.object({
   content: z.string().describe("Current content to add links to"),
   topic: z.string().describe("Main topic to search related content for"),
   relatedPosts: z
      .array(
         z.object({
            slug: z.string(),
            title: z.string(),
            description: z.string().optional(),
            relevance: z.string().optional(),
         }),
      )
      .describe("Related posts from searchPreviousContent tool"),
   maxLinks: z.number().default(3).describe("Maximum number of links to add"),
});

const LinkAddedSchema = z.object({
   title: z.string(),
   slug: z.string(),
   insertedAt: z.string(),
});

const AddInternalLinksOutputSchema = z.object({
   success: z.boolean(),
   modifiedContent: z.string(),
   linksAdded: z.array(LinkAddedSchema),
   message: z.string().optional(),
});

export const addInternalLinksTool = createTool({
   id: "addInternalLinks",
   description:
      "Insert internal links into content using related posts from searchPreviousContent. Use this after searching for related content.",
   inputSchema: AddInternalLinksInputSchema,
   outputSchema: AddInternalLinksOutputSchema,
   execute: async (input) => {
      const { content, relatedPosts, maxLinks } = input;

      if (!relatedPosts || relatedPosts.length === 0) {
         return {
            success: false,
            modifiedContent: content,
            linksAdded: [],
            message:
               "No related posts provided. Run searchPreviousContent first.",
         };
      }

      let modifiedContent = content;
      const linksAdded: Array<{
         title: string;
         slug: string;
         insertedAt: string;
      }> = [];

      // Find all H2 headings for insertion points
      const h2Headings = modifiedContent.match(/^## [^\n]+$/gm) || [];

      for (let i = 0; i < Math.min(relatedPosts.length, maxLinks); i++) {
         const post = relatedPosts[i];
         if (!post) continue;

         // Create link markdown - use blockquote style for visibility
         const linkMarkdown = `\n\n> **Leia também:** [${post.title}](/blog/${post.slug})\n`;

         const nextHeading = h2Headings[i + 1];
         if (nextHeading) {
            // Insert before the next heading (after current section)
            const headingPos = modifiedContent.indexOf(nextHeading);
            if (headingPos > 0) {
               modifiedContent =
                  modifiedContent.slice(0, headingPos) +
                  linkMarkdown +
                  modifiedContent.slice(headingPos);
               linksAdded.push({
                  title: post.title,
                  slug: post.slug,
                  insertedAt: `before "${nextHeading}"`,
               });
            }
         } else {
            // Insert before conclusion or at the end
            const conclusionMatch = modifiedContent.match(
               /^## (?:Conclusão|Resumo|Considerações|Conclusion|Summary)/m,
            );
            if (conclusionMatch) {
               const insertPoint = modifiedContent.indexOf(conclusionMatch[0]);
               modifiedContent =
                  modifiedContent.slice(0, insertPoint) +
                  linkMarkdown +
                  modifiedContent.slice(insertPoint);
               linksAdded.push({
                  title: post.title,
                  slug: post.slug,
                  insertedAt: "before conclusion",
               });
            } else {
               // Add at the end if no conclusion found
               modifiedContent = modifiedContent + linkMarkdown;
               linksAdded.push({
                  title: post.title,
                  slug: post.slug,
                  insertedAt: "end of content",
               });
            }
         }
      }

      return {
         success: linksAdded.length > 0,
         modifiedContent,
         linksAdded,
         message:
            linksAdded.length > 0
               ? `Added ${linksAdded.length} internal links`
               : "No suitable insertion points found",
      };
   },
});
