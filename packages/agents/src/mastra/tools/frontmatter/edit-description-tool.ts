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
   execute: async (inputData, context) => {
      const result = {
         success: true,
         newDescription: inputData.description,
      };

      const onMetaUpdate = context?.requestContext?.get("onMetaUpdate") as
         | ((patch: Record<string, unknown>) => Promise<void>)
         | undefined;

      if (onMetaUpdate) {
         await onMetaUpdate({ description: inputData.description });
      }

      return result;
   },
});
