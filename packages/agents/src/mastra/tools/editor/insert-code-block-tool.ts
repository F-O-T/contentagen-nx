import { generateCodeBlockString } from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertCodeBlockTool = createTool({
   id: "insert-code-block",
   description:
      "Inserts a code block with syntax highlighting into the blog post. Perfect for technical tutorials and examples.",
   inputSchema: z.object({
      code: z.string().describe("The code content"),
      language: z
         .string()
         .optional()
         .describe(
            "Programming language for syntax highlighting (e.g., 'javascript', 'python', 'typescript', 'bash')",
         ),
      position: z
         .enum(["cursor", "afterParagraph", "end"])
         .default("cursor")
         .describe("Where to insert the code block"),
      paragraphIndex: z
         .number()
         .optional()
         .describe("Paragraph index for afterParagraph position"),
      caption: z
         .string()
         .optional()
         .describe("Optional caption or filename to display above the code"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      markdown: z.string(),
      language: z.string().optional(),
      lineCount: z.number(),
   }),
   execute: async (inputData) => {
      const markdown = generateCodeBlockString(
         inputData.code,
         inputData.language,
         "fenced",
      );

      return {
         success: true,
         markdown,
         language: inputData.language,
         lineCount: inputData.code.split("\n").length,
      };
   },
});
