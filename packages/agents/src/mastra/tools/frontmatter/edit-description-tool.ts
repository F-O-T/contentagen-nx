import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editDescriptionTool = createTool({
   id: "edit-description",
   description:
      "Edit the meta description for SEO. This appears in search engine results below the title.",
   inputSchema: z.object({
      description: z
         .string()
         .max(500)
         .describe(
            "The meta description for SEO (recommended: 150-160 characters)",
         ),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      newDescription: z.string(),
   }),
   execute: async (inputData) => {
      return {
         success: true,
         newDescription: inputData.description,
      };
   },
});
