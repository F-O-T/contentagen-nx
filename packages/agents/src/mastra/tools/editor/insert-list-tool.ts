import {
   generateListString,
   generateTaskListString,
   normalizeMarkdownEmphasis,
} from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertListTool = createTool({
   id: "insert-list",
   description:
      "Inserts a list (bullet, numbered, or checklist) into the blog post. Great for organizing information and steps.",
   inputSchema: z.object({
      type: z
         .enum(["bullet", "numbered", "checklist"])
         .describe(
            "Type of list. 'bullet' for unordered, 'numbered' for ordered/steps, 'checklist' for tasks",
         ),
      items: z.array(z.string()).min(1).describe("Array of list items"),
      position: z
         .enum(["cursor", "afterParagraph", "end"])
         .default("cursor")
         .describe("Where to insert the list"),
      paragraphIndex: z
         .number()
         .optional()
         .describe("Paragraph index for afterParagraph position"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      markdown: z.string(),
      type: z.string(),
      itemCount: z.number(),
   }),
   execute: async (inputData) => {
      // Normalize markdown to fix LLM escaping issues (e.g., \*\* → **)
      const normalizedItems = inputData.items.map(normalizeMarkdownEmphasis);

      let markdown: string;

      if (inputData.type === "checklist") {
         // Use task list generator for checklists
         markdown = generateTaskListString(
            normalizedItems.map((item) => ({ text: item, checked: false })),
         );
      } else {
         // Use list generator for bullet/numbered
         const ordered = inputData.type === "numbered";
         markdown = generateListString(normalizedItems, ordered);
      }

      return {
         success: true,
         markdown,
         type: inputData.type,
         itemCount: normalizedItems.length,
      };
   },
});
