import { createTool } from "@mastra/core/tools";
import { search } from "@packages/search";
import { AppError } from "@packages/utils/errors";
import { z } from "zod";

const FACT_TYPES = ["statistics", "studies", "quotes", "examples"] as const;

// Domains considered authoritative for different fact types
const AUTHORITATIVE_DOMAINS: Record<string, string[]> = {
   statistics: [
      "statista.com",
      "pewresearch.org",
      "gallup.com",
      "census.gov",
      "bls.gov",
      "worldbank.org",
      "who.int",
      "cdc.gov",
      "nih.gov",
      "imf.org",
   ],
   studies: [
      "nih.gov",
      "ncbi.nlm.nih.gov",
      "nature.com",
      "sciencedirect.com",
      "springer.com",
      "jstor.org",
      "arxiv.org",
      "pubmed.gov",
      "scholar.google.com",
   ],
   quotes: [
      "forbes.com",
      "hbr.org",
      "bloomberg.com",
      "reuters.com",
      "nytimes.com",
      "wsj.com",
      "economist.com",
      "wired.com",
      "techcrunch.com",
   ],
   examples: [
      "github.com",
      "stackoverflow.com",
      "medium.com",
      "dev.to",
      "freecodecamp.org",
      "smashingmagazine.com",
      "css-tricks.com",
   ],
};

// General authoritative TLDs
const AUTHORITATIVE_TLDS = [".gov", ".edu", ".org"];

export const factFinderTool = createTool({
   id: "fact-finder",
   description:
      "Searches for facts, statistics, studies, quotes, and examples to enrich your content. Filters for authoritative sources and provides citation-ready information.",
   inputSchema: z.object({
      topic: z.string().describe("The topic to find facts about"),
      factTypes: z
         .array(z.enum(FACT_TYPES))
         .min(1)
         .describe("Types of facts to search for"),
      maxFacts: z
         .number()
         .min(3)
         .max(20)
         .optional()
         .default(10)
         .describe("Maximum number of facts to return"),
   }),
   outputSchema: z.object({
      topic: z.string(),
      facts: z.array(
         z.object({
            type: z.enum(FACT_TYPES),
            content: z.string(),
            source: z.string(),
            sourceUrl: z.string(),
            credibility: z.enum(["high", "medium", "low"]),
            year: z.number().optional(),
         }),
      ),
      sourcesSummary: z.object({
         totalSources: z.number(),
         highCredibility: z.number(),
         mediumCredibility: z.number(),
         lowCredibility: z.number(),
      }),
      suggestedCitations: z.array(z.string()),
   }),
   execute: async (inputData) => {
      const { topic, factTypes, maxFacts } = inputData;

      try {
         const facts: Array<{
            type: (typeof FACT_TYPES)[number];
            content: string;
            source: string;
            sourceUrl: string;
            credibility: "high" | "medium" | "low";
            year?: number;
         }> = [];

         // Build search queries for each fact type
         const searchQueries: Array<{
            type: (typeof FACT_TYPES)[number];
            query: string;
         }> = [];

         const currentYear = new Date().getFullYear();

         for (const factType of factTypes) {
            switch (factType) {
               case "statistics":
                  searchQueries.push({
                     type: "statistics",
                     query: `${topic} statistics ${currentYear}`,
                  });
                  searchQueries.push({
                     type: "statistics",
                     query: `${topic} data percentage numbers`,
                  });
                  break;
               case "studies":
                  searchQueries.push({
                     type: "studies",
                     query: `${topic} research study findings`,
                  });
                  searchQueries.push({
                     type: "studies",
                     query: `${topic} academic paper journal`,
                  });
                  break;
               case "quotes":
                  searchQueries.push({
                     type: "quotes",
                     query: `${topic} expert quote says`,
                  });
                  searchQueries.push({
                     type: "quotes",
                     query: `${topic} CEO founder interview`,
                  });
                  break;
               case "examples":
                  searchQueries.push({
                     type: "examples",
                     query: `${topic} example case study`,
                  });
                  searchQueries.push({
                     type: "examples",
                     query: `${topic} success story implementation`,
                  });
                  break;
            }
         }

         // Execute searches in parallel
         const searchResults = await Promise.all(
            searchQueries.map(async ({ type, query }) => {
               try {
                  const { results } = await search(query, {
                     maxResults: 5,
                     searchDepth: "basic",
                     includeAnswer: false,
                     includeRawContent: false,
                  });
                  return { type, results };
               } catch {
                  return { type, results: [] };
               }
            }),
         );

         // Helper to determine credibility
         const getCredibility = (url: string): "high" | "medium" | "low" => {
            try {
               const urlObj = new URL(url);
               const domain = urlObj.hostname.toLowerCase();

               // Check authoritative TLDs
               for (const tld of AUTHORITATIVE_TLDS) {
                  if (domain.endsWith(tld)) return "high";
               }

               // Check authoritative domains for all fact types
               for (const domains of Object.values(AUTHORITATIVE_DOMAINS)) {
                  if (domains.some((d) => domain.includes(d))) return "high";
               }

               // Check for wikipedia (medium credibility - good for background, not primary source)
               if (domain.includes("wikipedia.org")) return "medium";

               // Check for known reputable news/tech sites
               const reputableSites = [
                  "bbc.com",
                  "cnn.com",
                  "theguardian.com",
                  "arstechnica.com",
                  "zdnet.com",
                  "venturebeat.com",
                  "inc.com",
                  "entrepreneur.com",
               ];
               if (reputableSites.some((d) => domain.includes(d)))
                  return "medium";

               return "low";
            } catch {
               return "low";
            }
         };

         // Helper to extract year from text
         const extractYear = (text: string): number | undefined => {
            const yearMatch = text.match(/20[0-2]\d/);
            return yearMatch ? parseInt(yearMatch[0], 10) : undefined;
         };

         // Helper to extract fact content from snippet
         const extractFactContent = (
            snippet: string,
            type: (typeof FACT_TYPES)[number],
         ): string | null => {
            const sentences = snippet
               .split(/[.!?]+/)
               .filter((s) => s.trim().length > 20);

            for (const sentence of sentences) {
               const s = sentence.trim();

               switch (type) {
                  case "statistics":
                     // Look for numbers, percentages, amounts
                     if (
                        /\d+%|\$[\d,]+|\d+\s*(million|billion|thousand)/i.test(
                           s,
                        )
                     ) {
                        return s;
                     }
                     break;
                  case "studies":
                     // Look for research-related keywords
                     if (
                        /study|research|found|showed|according|published/i.test(
                           s,
                        )
                     ) {
                        return s;
                     }
                     break;
                  case "quotes":
                     // Look for quote patterns
                     if (
                        /said|says|according to|noted|explained|"[^"]+"/i.test(
                           s,
                        )
                     ) {
                        return s;
                     }
                     break;
                  case "examples":
                     // Look for example patterns
                     if (
                        /example|case|such as|like|including|for instance/i.test(
                           s,
                        )
                     ) {
                        return s;
                     }
                     break;
               }
            }

            // Fallback to first substantial sentence
            return sentences[0] || null;
         };

         // Process search results
         const seenUrls = new Set<string>();

         for (const { type, results } of searchResults) {
            for (const result of results) {
               // Skip duplicates
               if (seenUrls.has(result.url)) continue;
               seenUrls.add(result.url);

               const content = extractFactContent(result.snippet, type);
               if (!content) continue;

               const credibility = getCredibility(result.url);
               const year =
                  extractYear(result.snippet) || extractYear(result.title);

               facts.push({
                  type,
                  content,
                  source: result.title.replace(/\s*[-|].+$/, "").trim(), // Clean title
                  sourceUrl: result.url,
                  credibility,
                  year,
               });
            }
         }

         // Sort by credibility and remove duplicates
         facts.sort((a, b) => {
            const credOrder = { high: 0, medium: 1, low: 2 };
            return credOrder[a.credibility] - credOrder[b.credibility];
         });

         // Limit to maxFacts, prioritizing high credibility and variety of types
         const selectedFacts: typeof facts = [];
         const typeCounts: Record<string, number> = {};

         // First pass: add high credibility facts
         for (const fact of facts) {
            if (selectedFacts.length >= maxFacts) break;
            if (fact.credibility === "high") {
               selectedFacts.push(fact);
               typeCounts[fact.type] = (typeCounts[fact.type] || 0) + 1;
            }
         }

         // Second pass: add medium credibility for types we're missing
         for (const fact of facts) {
            if (selectedFacts.length >= maxFacts) break;
            if (
               fact.credibility === "medium" &&
               (typeCounts[fact.type] || 0) < 2 &&
               !selectedFacts.some((f) => f.sourceUrl === fact.sourceUrl)
            ) {
               selectedFacts.push(fact);
               typeCounts[fact.type] = (typeCounts[fact.type] || 0) + 1;
            }
         }

         // Third pass: fill remaining slots
         for (const fact of facts) {
            if (selectedFacts.length >= maxFacts) break;
            if (!selectedFacts.some((f) => f.sourceUrl === fact.sourceUrl)) {
               selectedFacts.push(fact);
            }
         }

         // Generate citation suggestions
         const suggestedCitations = selectedFacts
            .filter((f) => f.credibility !== "low")
            .slice(0, 5)
            .map((f) => {
               const year = f.year ? ` (${f.year})` : "";
               return `${f.source}${year} - ${f.sourceUrl}`;
            });

         // Calculate summary
         const sourcesSummary = {
            totalSources: selectedFacts.length,
            highCredibility: selectedFacts.filter(
               (f) => f.credibility === "high",
            ).length,
            mediumCredibility: selectedFacts.filter(
               (f) => f.credibility === "medium",
            ).length,
            lowCredibility: selectedFacts.filter((f) => f.credibility === "low")
               .length,
         };

         return {
            topic,
            facts: selectedFacts,
            sourcesSummary,
            suggestedCitations,
         };
      } catch (error) {
         throw AppError.internal(
            `Fact finder failed: ${(error as Error).message}`,
         );
      }
   },
});
