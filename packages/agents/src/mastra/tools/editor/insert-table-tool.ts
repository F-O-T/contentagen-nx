import { generateTableString } from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertTableTool = createTool({
   id: "insert-table",
   description:
      "Inserts a table into the blog post. Great for comparing features, showing data, or organizing structured information.",
   inputSchema: z.object({
      headers: z.array(z.string()).min(1).describe("Array of column headers"),
      rows: z
         .array(z.array(z.string()))
         .min(1)
         .describe("Array of rows, where each row is an array of cell values"),
      alignments: z
         .array(z.enum(["left", "center", "right"]).nullable())
         .optional()
         .describe("Optional array of column alignments (left, center, right)"),
      position: z
         .enum(["cursor", "afterParagraph", "end"])
         .default("cursor")
         .describe("Where to insert the table"),
      paragraphIndex: z
         .number()
         .optional()
         .describe("Paragraph index for afterParagraph position"),
      caption: z.string().optional().describe("Optional table caption"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      markdown: z.string(),
      columnCount: z.number(),
      rowCount: z.number(),
   }),
   execute: async (inputData) => {
      const markdown = generateTableString(
         inputData.headers,
         inputData.rows,
         inputData.alignments,
      );

      return {
         success: true,
         markdown,
         columnCount: inputData.headers.length,
         rowCount: inputData.rows.length,
      };
   },
});
