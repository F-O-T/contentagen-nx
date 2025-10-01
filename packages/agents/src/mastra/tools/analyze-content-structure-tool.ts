import { createTool } from "@mastra/core";
import z from "zod";

export const analyzeContentStructureTool = createTool({
   id: "analyze-content-structure",
   description:
      "Analyzes the overall structure and composition of markdown content. Provides comprehensive statistics about content elements.",
   inputSchema: z.object({
      text: z.string().describe("The markdown text to analyze"),
   }),
   outputSchema: z.object({
      structure: z
         .object({
            headings: z.number(),
            paragraphs: z.number(),
            lists: z.number(),
            codeBlocks: z.number(),
            links: z.number(),
            images: z.number(),
            words: z.number(),
         })
         .describe("Object containing counts of various content elements"),
   }),
   execute: async ({ context }) => {
      const { text } = context;
      const structure = {
         headings: (text.match(/^#{1,6}\s/gm) || []).length,
         paragraphs: text
            .split(/\n\s*\n/)
            .filter((p) => !p.match(/^#{1,6}\s|^[*\-+\d]/)).length,
         lists: (text.match(/^[*\-+]\s/gm) || []).length,
         codeBlocks: (text.match(/```[\s\S]*?```/g) || []).length,
         links: (text.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length,
         images: (text.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length,
         words: text.split(/\s+/).filter((w) => w.length > 0).length,
      };

      return { structure };
   },
});
