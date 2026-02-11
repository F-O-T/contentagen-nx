import {
   generateEmphasisString,
   generateInlineCodeString,
   generateLinkString,
   generateStrikethroughString,
   generateStrongString,
} from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const formatTextTool = createTool({
   id: "format-text",
   description:
      "Applies formatting to text in the editor. Can make text bold, italic, add links, or apply code formatting.",
   inputSchema: z.object({
      format: z
         .enum(["bold", "italic", "underline", "strikethrough", "code", "link"])
         .describe("The formatting style to apply"),
      scope: z
         .enum(["selection", "word", "paragraph"])
         .default("selection")
         .describe(
            "What to format. 'selection' = selected text, 'word' = word at cursor, 'paragraph' = entire paragraph",
         ),
      linkUrl: z
         .string()
         .url()
         .optional()
         .describe("URL for link formatting (required when format is 'link')"),
      searchText: z
         .string()
         .optional()
         .describe(
            "Specific text to format (if not using selection). Will find and format this text.",
         ),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      markdown: z.string(),
      format: z.string(),
      scope: z.string(),
   }),
   execute: async (inputData) => {
      const text = inputData.searchText || "";
      let markdown = "";

      switch (inputData.format) {
         case "bold":
            markdown = generateStrongString(text);
            break;
         case "italic":
            markdown = generateEmphasisString(text);
            break;
         case "code":
            markdown = generateInlineCodeString(text);
            break;
         case "link":
            markdown = generateLinkString(text, inputData.linkUrl || "");
            break;
         case "strikethrough":
            markdown = generateStrikethroughString(text);
            break;
         case "underline":
            // Underline is not standard markdown, use HTML fallback
            markdown = `<u>${text}</u>`;
            break;
         default:
            markdown = text;
      }

      return {
         success: true,
         markdown,
         format: inputData.format,
         scope: inputData.scope,
      };
   },
});
