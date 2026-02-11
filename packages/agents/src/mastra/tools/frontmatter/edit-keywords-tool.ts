import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editKeywordsTool = createTool({
   id: "edit-keywords",
   description:
      "Set the SEO keywords/tags for the blog post. Keywords help with search optimization and content categorization.",
   inputSchema: z.object({
      keywords: z
         .array(z.string())
         .max(10)
         .describe("Array of SEO keywords/tags (max 10)"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      keywords: z.array(z.string()),
   }),
   execute: async (inputData) => {
      return {
         success: true,
         keywords: inputData.keywords,
      };
   },
});
