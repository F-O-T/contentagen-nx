import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const replaceTextTool = createTool({
   id: "replace-text",
   description:
      "Replaces text in the editor by searching for a pattern and replacing it with new text. Useful for editing and improving existing content.",
   inputSchema: z.object({
      searchText: z
         .string()
         .describe("The exact text to find and replace. Must match exactly."),
      replaceWith: z.string().describe("The new text to replace it with"),
      scope: z
         .enum(["selection", "paragraph", "all"])
         .default("selection")
         .describe(
            "Where to apply the replacement. 'selection' = only in selected text, 'paragraph' = in current paragraph, 'all' = entire document",
         ),
      matchCase: z
         .boolean()
         .optional()
         .default(true)
         .describe("Whether to match case exactly"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      replacements: z.number(),
      searchText: z.string(),
      replaceWith: z.string(),
   }),
   execute: async (inputData, context) => {
      const result = {
         success: true,
         replacements: 1, // Estimated, actual count comes from frontend
         searchText: inputData.searchText,
         replaceWith: inputData.replaceWith,
      };

      const onBodyUpdate = context?.requestContext?.get("onBodyUpdate") as
         | ((toolName: string, output: Record<string, unknown>) => Promise<void>)
         | undefined;

      if (onBodyUpdate) {
         await onBodyUpdate("replace-text", result as Record<string, unknown>);
      }

      return result;
   },
});
