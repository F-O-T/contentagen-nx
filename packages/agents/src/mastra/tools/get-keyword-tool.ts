import { createTool } from "@mastra/core";
import z from "zod";

export const getKeywordsTool = createTool({
   id: "extract-keywords",
   description:
      "Extracts most frequent keywords from text for SEO purposes. Filters by minimum word length and returns top keywords by frequency.",
   inputSchema: z.object({
      text: z.string().describe("The text to analyze"),
      minLength: z
         .number()
         .default(4)
         .describe("Minimum word length to consider"),
   }),
   outputSchema: z.object({
      keywords: z
         .array(z.string())
         .describe("Array of top 10 keywords sorted by frequency"),
   }),
   execute: async ({ context }) => {
      const { text, minLength = 4 } = context;
      const words = text
         .toLowerCase()
         .replace(/[^\w\s]/g, "")
         .split(/\s+/)
         .filter((word) => word.length >= minLength);

      const frequency = new Map<string, number>();
      words.forEach((word) => {
         frequency.set(word, (frequency.get(word) || 0) + 1);
      });

      const keywords = Array.from(frequency.entries())
         .sort((a, b) => b[1] - a[1])
         .slice(0, 10)
         .map((entry) => entry[0]);

      return { keywords };
   },
});
