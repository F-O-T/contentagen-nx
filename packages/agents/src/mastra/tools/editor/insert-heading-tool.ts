import {
   generateHeadingString,
   normalizeMarkdownEmphasis,
} from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertHeadingTool = createTool({
   id: "insert-heading",
   description:
      "Inserts a heading (h1-h4) into the blog post. Useful for creating document structure and sections.",
   inputSchema: z.object({
      level: z
         .enum(["h1", "h2", "h3", "h4"])
         .describe(
            "Heading level. Use h1 sparingly (title), h2 for main sections, h3-h4 for subsections",
         ),
      text: z.string().describe("The heading text"),
      position: z
         .enum(["cursor", "afterParagraph", "beforeParagraph", "end"])
         .default("cursor")
         .describe("Where to insert the heading"),
      paragraphIndex: z
         .number()
         .optional()
         .describe(
            "Paragraph index for afterParagraph/beforeParagraph positions",
         ),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      markdown: z.string(),
      level: z.string(),
      text: z.string(),
   }),
   execute: async (inputData, context) => {
      // Normalize markdown to fix LLM escaping issues (e.g., \*\* → **)
      const normalizedText = normalizeMarkdownEmphasis(inputData.text);

      const levelNum = Number.parseInt(inputData.level.replace("h", ""), 10) as
         | 1
         | 2
         | 3
         | 4
         | 5
         | 6;
      const markdown = generateHeadingString(levelNum, normalizedText);

      const result = {
         success: true,
         markdown,
         level: inputData.level,
         text: normalizedText,
      };

      const onBodyUpdate = context?.requestContext?.get("onBodyUpdate") as
         | ((toolName: string, output: Record<string, unknown>) => Promise<void>)
         | undefined;

      if (onBodyUpdate) {
         await onBodyUpdate("insert-heading", result as Record<string, unknown>);
      }

      return result;
   },
});
