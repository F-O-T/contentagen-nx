import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editTitleTool = createTool({
   id: "edit-title",
   description:
      "Edit the blog post title. The title appears at the top of the page and in search results.",
   inputSchema: z.object({
      title: z
         .string()
         .min(1)
         .max(200)
         .describe("The new title for the blog post (1-200 characters)"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      newTitle: z.string(),
   }),
   execute: async (inputData, context) => {
      const result = {
         success: true,
         newTitle: inputData.title,
      };

      const onMetaUpdate = context?.requestContext?.get("onMetaUpdate") as
         | ((patch: Record<string, unknown>) => Promise<void>)
         | undefined;

      if (onMetaUpdate) {
         await onMetaUpdate({ title: inputData.title });
      }

      return result;
   },
});
