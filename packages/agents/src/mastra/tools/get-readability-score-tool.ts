import { createTool } from "@mastra/core";
import z from "zod";

export const getReadabilityScoreTool = createTool({
   id: "calculate-readability-score",
   description:
      "Calculates Flesch Reading Ease score for text readability. Higher scores indicate easier readability (0-100 scale). 60-70 = standard, 90-100 = very easy.",
   inputSchema: z.object({
      text: z.string().describe("The text to analyze"),
   }),
   outputSchema: z.object({
      score: z.number().describe("Readability score"),
   }),
   execute: async ({ context }) => {
      const { text } = context;

      const countSyllables = (word: string): number => {
         word = word.toLowerCase().replace(/[^a-z]/g, "");
         if (word.length <= 3) return 1;

         const vowels = word.match(/[aeiouy]+/g);
         let count = vowels ? vowels.length : 1;

         if (word.endsWith("e")) count--;
         if (word.endsWith("le") && word.length > 2) count++;

         return Math.max(count, 1);
      };

      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const words = text.split(/\s+/).filter((w) => w.length > 0);
      const syllables = words.reduce(
         (sum, word) => sum + countSyllables(word),
         0,
      );

      const avgWordsPerSentence = words.length / sentences.length;
      const avgSyllablesPerWord = syllables / words.length;

      const score =
         206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

      return { score };
   },
});
