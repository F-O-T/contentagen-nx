import {
   generateBlockquoteString,
   normalizeMarkdownEmphasis,
} from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertTextTool = createTool({
   id: "insert-text",
   description:
      "Inserts text at a specific position in the editor. Use this to add new content to the blog post.",
   inputSchema: z.object({
      text: z.string().describe("The text content to insert"),
      position: z
         .enum(["cursor", "start", "end", "afterHeading", "beforeParagraph"])
         .describe(
            "Where to insert the text. 'cursor' = at current cursor, 'start' = beginning of document, 'end' = end of document, 'afterHeading' = after a specific heading, 'beforeParagraph' = before a specific paragraph",
         ),
      targetIndex: z
         .number()
         .optional()
         .describe(
            "Target index for afterHeading or beforeParagraph positions (0-based)",
         ),
      isBlockquote: z
         .boolean()
         .optional()
         .default(false)
         .describe("If true, wraps the text as a blockquote"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      markdown: z.string(),
      insertedText: z.string(),
      position: z.string(),
   }),
   execute: async (inputData, context) => {
      // Normalize markdown to fix LLM escaping issues (e.g., \*\* → **)
      const normalizedText = normalizeMarkdownEmphasis(inputData.text);

      // Use blockquote generator if requested
      const markdown = inputData.isBlockquote
         ? generateBlockquoteString(normalizedText)
         : normalizedText;

      const result = {
         success: true,
         markdown,
         insertedText: normalizedText,
         position: inputData.position,
      };

      const onBodyUpdate = context?.requestContext?.get("onBodyUpdate") as
         | ((toolName: string, output: Record<string, unknown>) => Promise<void>)
         | undefined;

      if (onBodyUpdate) {
         await onBodyUpdate("insert-text", result as Record<string, unknown>);
      }

      return result;
   },
});
