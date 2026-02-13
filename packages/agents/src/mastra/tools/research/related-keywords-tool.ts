import { createTool } from "@mastra/core/tools";
import { search } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

export const relatedKeywordsTool = createTool({
   id: "related-keywords",
   description:
      "Discovers related keywords, long-tail variations, and question-based queries for a primary keyword. Use this to expand your keyword strategy beyond the initial query.",
   inputSchema: z.object({
      primaryKeyword: z
         .string()
         .describe("The main keyword to find related terms for"),
      maxSuggestions: z
         .number()
         .min(5)
         .max(30)
         .optional()
         .default(15)
         .describe("Maximum number of related keywords to return"),
   }),
   outputSchema: z.object({
      primaryKeyword: z.string(),
      relatedKeywords: z.array(
         z.object({
            keyword: z.string(),
            relevance: z.enum(["high", "medium", "low"]),
            source: z.string().describe("Where this keyword was found"),
         }),
      ),
      longTailVariations: z.array(z.string()),
      questions: z.array(z.string()),
      searchModifiers: z.array(z.string()),
   }),
   execute: async (inputData) => {
      const { primaryKeyword, maxSuggestions } = inputData;

      try {
         // Search for the primary keyword to extract related terms
         const [mainResults, questionResults, howToResults] = await Promise.all(
            [
               search(primaryKeyword, {
                  maxResults: 10,
                  searchDepth: "basic",
                  includeAnswer: false,
                  includeRawContent: false,
               }),
               search(`${primaryKeyword} questions`, {
                  maxResults: 5,
                  searchDepth: "basic",
                  includeAnswer: false,
                  includeRawContent: false,
               }),
               search(`how to ${primaryKeyword}`, {
                  maxResults: 5,
                  searchDepth: "basic",
                  includeAnswer: false,
                  includeRawContent: false,
               }),
            ],
         );

         // Stop words to filter out
         const stopWords = new Set([
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "as",
            "is",
            "was",
            "are",
            "were",
            "be",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "will",
            "would",
            "could",
            "should",
            "may",
            "might",
            "must",
            "that",
            "this",
            "it",
            "you",
            "your",
            "we",
            "our",
            "they",
            "their",
            "what",
            "how",
            "why",
            "when",
            "where",
            "which",
            "who",
            "its",
            "can",
            "just",
            "than",
            "then",
            "now",
            "only",
            "also",
            "more",
            "some",
            "any",
            "all",
            "most",
            "other",
            "into",
            "over",
            "such",
            "these",
            "those",
            "about",
            "after",
            "before",
            "between",
            "through",
            "during",
            "without",
            "under",
            "around",
            "among",
         ]);

         // Primary keyword words for filtering
         const primaryWords = new Set(
            primaryKeyword.toLowerCase().split(/\s+/).filter(Boolean),
         );

         // Extract words from titles and snippets
         const wordFrequency: Record<
            string,
            { count: number; sources: Set<string> }
         > = {};

         const processText = (text: string, source: string) => {
            const words = text
               .toLowerCase()
               .replace(/[^\w\s-]/g, " ")
               .split(/\s+/)
               .filter(Boolean);

            for (const word of words) {
               if (
                  word.length > 3 &&
                  !stopWords.has(word) &&
                  !primaryWords.has(word) &&
                  !/^\d+$/.test(word)
               ) {
                  if (!wordFrequency[word]) {
                     wordFrequency[word] = { count: 0, sources: new Set() };
                  }
                  wordFrequency[word].count++;
                  wordFrequency[word].sources.add(source);
               }
            }
         };

         // Process main search results
         for (const result of mainResults.results) {
            processText(result.title, "title");
            processText(result.snippet, "snippet");
         }

         // Extract related keywords with relevance scoring
         const relatedKeywords = Object.entries(wordFrequency)
            .filter(([, data]) => data.count >= 2)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, maxSuggestions)
            .map(([word, data]) => {
               let relevance: "high" | "medium" | "low";
               if (data.count >= 5 || data.sources.has("title")) {
                  relevance = "high";
               } else if (data.count >= 3) {
                  relevance = "medium";
               } else {
                  relevance = "low";
               }

               return {
                  keyword: word,
                  relevance,
                  source: Array.from(data.sources).join(", "),
               };
            });

         // Extract long-tail variations from titles
         const longTailVariations: string[] = [];
         const allResults = [...mainResults.results, ...howToResults.results];

         for (const result of allResults) {
            const title = result.title.toLowerCase();
            // Look for titles that contain our keyword plus additional words
            if (
               title.includes(primaryKeyword.toLowerCase()) &&
               title.split(/\s+/).length >
                  primaryKeyword.split(/\s+/).length + 2
            ) {
               // Clean up the title for use as a long-tail keyword
               const cleaned = result.title
                  .replace(/\s*[-|:]\s*.+$/, "") // Remove brand suffixes
                  .replace(/^\d+\.\s*/, "") // Remove leading numbers
                  .trim();

               if (
                  cleaned.length > primaryKeyword.length &&
                  cleaned.length < 80 &&
                  !longTailVariations.includes(cleaned)
               ) {
                  longTailVariations.push(cleaned);
               }
            }
         }

         // Extract question-based keywords
         const questions: string[] = [];
         const questionPatterns = [
            /what\s+is\s+.+/i,
            /how\s+to\s+.+/i,
            /how\s+do\s+.+/i,
            /why\s+.+/i,
            /when\s+.+/i,
            /where\s+.+/i,
            /which\s+.+/i,
            /can\s+.+\?/i,
            /should\s+.+\?/i,
         ];

         for (const result of [
            ...questionResults.results,
            ...howToResults.results,
         ]) {
            for (const pattern of questionPatterns) {
               const match = result.title.match(pattern);
               if (match && !questions.includes(match[0])) {
                  const question = match[0].replace(/\s*[-|:].+$/, "").trim();
                  if (question.length > 10 && question.length < 100) {
                     questions.push(question);
                  }
               }
            }
         }

         // Generate search modifiers based on patterns found
         const searchModifiers: string[] = [];
         const modifierPatterns = [
            { pattern: /best\s+/i, modifier: "best" },
            { pattern: /top\s+\d+/i, modifier: "top 10" },
            { pattern: /guide/i, modifier: "guide" },
            { pattern: /tutorial/i, modifier: "tutorial" },
            { pattern: /example/i, modifier: "examples" },
            { pattern: /template/i, modifier: "template" },
            { pattern: /free/i, modifier: "free" },
            {
               pattern: /\d{4}/i,
               modifier: new Date().getFullYear().toString(),
            },
            { pattern: /beginner/i, modifier: "for beginners" },
            { pattern: /advanced/i, modifier: "advanced" },
            { pattern: /vs\s+|versus/i, modifier: "vs" },
            { pattern: /alternative/i, modifier: "alternatives" },
         ];

         for (const result of mainResults.results) {
            for (const { pattern, modifier } of modifierPatterns) {
               if (
                  pattern.test(result.title) &&
                  !searchModifiers.includes(modifier)
               ) {
                  searchModifiers.push(modifier);
               }
            }
         }

         return {
            primaryKeyword,
            relatedKeywords,
            longTailVariations: longTailVariations.slice(0, 10),
            questions: questions.slice(0, 10),
            searchModifiers,
         };
      } catch (error) {
         throw AppError.internal(
            `Related keywords search failed: ${(error as Error).message}`,
         );
      }
   },
});
