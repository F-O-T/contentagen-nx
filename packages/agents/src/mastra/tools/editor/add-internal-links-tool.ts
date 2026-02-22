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
      "Insert internal links into content using related posts from searchPreviousContent. Uses /conteudo/ URL prefix and inserts inline markdown links within paragraph text. Use this after searching for related content.",
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

      // Find paragraphs (prose text lines, not headings/blockquotes/lists)
      // A paragraph is a non-empty line not starting with #, >, -, *, or digits followed by .
      const paragraphPattern = /^(?!#|>|-|\*|\d+\.)(.{80,})/gm;
      const paragraphs: Array<{ text: string; index: number }> = [];
      let match: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: regex exec loop pattern
      while ((match = paragraphPattern.exec(modifiedContent)) !== null) {
         paragraphs.push({ text: match[0], index: match.index });
      }

      const postsToInsert = relatedPosts.slice(0, maxLinks);

      // Track cumulative offset delta to account for characters added by previous inline insertions.
      // Each inline insertion shifts all subsequent paragraph indices.
      let offsetDelta = 0;

      for (let i = 0; i < postsToInsert.length; i++) {
         const post = postsToInsert[i];
         if (!post) continue;

         const paragraph = paragraphs[i * 2]; // space out links across paragraphs

         if (paragraph) {
            // Insert inline after first sentence end ". "
            const sentenceEnd = paragraph.text.indexOf(". ");
            if (sentenceEnd > 20) {
               // Adjust for characters added by previous insertions
               const insertOffset =
                  paragraph.index + offsetDelta + sentenceEnd + 2;
               const anchor = `[${post.title}](/conteudo/${post.slug})`;
               modifiedContent =
                  modifiedContent.slice(0, insertOffset) +
                  anchor +
                  " " +
                  modifiedContent.slice(insertOffset);
               // anchor.length + 1 for the trailing space
               offsetDelta += anchor.length + 1;
               linksAdded.push({
                  title: post.title,
                  slug: post.slug,
                  insertedAt: `inline in paragraph ${i + 1}`,
               });
               continue;
            }
         }

         // Fallback: insert before conclusion or at end
         const conclusionMatch = modifiedContent.match(
            /^## (?:Conclusão|Resumo|Considerações|Conclusion|Summary)/m,
         );
         const insertText = `\n[${post.title}](/conteudo/${post.slug})\n\n`;
         if (conclusionMatch) {
            const insertPoint = modifiedContent.indexOf(conclusionMatch[0]);
            modifiedContent =
               modifiedContent.slice(0, insertPoint) +
               insertText +
               modifiedContent.slice(insertPoint);
            // Update delta in case subsequent inline insertions target paragraphs after this point
            offsetDelta += insertText.length;
            linksAdded.push({
               title: post.title,
               slug: post.slug,
               insertedAt: "before conclusion",
            });
         } else {
            modifiedContent += insertText;
            linksAdded.push({
               title: post.title,
               slug: post.slug,
               insertedAt: "end of content",
            });
         }
      }

      return {
         success: linksAdded.length > 0,
         modifiedContent,
         linksAdded,
         message:
            linksAdded.length > 0
               ? `Added ${linksAdded.length} internal links inline`
               : "No suitable insertion points found",
      };
   },
});
