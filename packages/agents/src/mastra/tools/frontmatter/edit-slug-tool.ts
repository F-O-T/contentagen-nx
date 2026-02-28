import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const editSlugTool = createTool({
   id: "edit-slug",
   description:
      "Edit the URL slug for the blog post. The slug is the URL-friendly version of the title.",
   inputSchema: z.object({
      slug: z
         .string()
         .regex(
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Slug must be lowercase with hyphens only (e.g., 'my-blog-post')",
         )
         .describe(
            "The URL slug (lowercase letters, numbers, and hyphens only)",
         ),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      newSlug: z.string(),
   }),
   execute: async (inputData, context) => {
      const result = {
         success: true,
         newSlug: inputData.slug,
      };

      const onMetaUpdate = context?.requestContext?.get("onMetaUpdate") as
         | ((patch: Record<string, unknown>) => Promise<void>)
         | undefined;

      if (onMetaUpdate) {
         await onMetaUpdate({ slug: inputData.slug });
      }

      return result;
   },
});
