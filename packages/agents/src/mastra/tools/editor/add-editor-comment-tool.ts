import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const addEditorCommentTool = createTool({
   id: "add-editor-comment",
   description:
      "Add a comment annotation to a specific block in the editor. Use during SEO Audit or Review to explain why a section could be improved.",
   inputSchema: z.object({
      blockId: z
         .string()
         .describe(
            "The block ID (Plate node ID) to comment on. Use 'general' if unsure.",
         ),
      content: z
         .string()
         .min(1)
         .describe("The comment text explaining the issue or suggestion."),
      textRange: z
         .string()
         .optional()
         .describe(
            "The specific quoted text being annotated (optional, for context).",
         ),
      category: z
         .enum(["seo", "readability", "structure", "tone", "general"])
         .default("general")
         .describe("Category of the comment for visual grouping."),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      commentId: z.string(),
      blockId: z.string(),
      content: z.string(),
      category: z.string(),
   }),
   execute: async (input) => {
      const commentId = crypto.randomUUID();
      return {
         success: true,
         commentId,
         blockId: input.blockId,
         content: input.content,
         category: input.category,
      };
   },
});
