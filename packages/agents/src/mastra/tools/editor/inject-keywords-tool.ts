import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const InjectKeywordsInputSchema = z.object({
   content: z.string().describe("Current content to inject keywords into"),
   keywords: z.array(z.string()).describe("Keywords to inject"),
   targetDensity: z
      .number()
      .default(1.5)
      .describe("Target keyword density percentage"),
   preserveReadability: z.boolean().default(true),
});

const KeywordInjectionResultSchema = z.object({
   keyword: z.string(),
   previousCount: z.number(),
   newCount: z.number(),
   locations: z.array(z.string()),
});

const InjectKeywordsOutputSchema = z.object({
   success: z.boolean(),
   modifiedContent: z.string(),
   keywordsInjected: z.array(KeywordInjectionResultSchema),
   densityBefore: z.number(),
   densityAfter: z.number(),
});

export const injectKeywordsTool = createTool({
   id: "injectKeywords",
   description:
      "Automatically inject missing keywords into content to achieve target density. Use after seoScore shows keyword_density issues.",
   inputSchema: InjectKeywordsInputSchema,
   outputSchema: InjectKeywordsOutputSchema,
   execute: async (input) => {
      let content = input.content;
      const results: z.infer<
         typeof InjectKeywordsOutputSchema
      >["keywordsInjected"] = [];
      const wordCount = content.split(/\s+/).filter(Boolean).length;

      // Calculate initial total density
      const initialTotalOccurrences = input.keywords.reduce((sum, kw) => {
         return sum + (content.match(new RegExp(kw, "gi")) || []).length;
      }, 0);
      const densityBefore = (initialTotalOccurrences / wordCount) * 100;

      for (const keyword of input.keywords) {
         const regex = new RegExp(keyword, "gi");
         const previousCount = (content.match(regex) || []).length;
         const previousDensity = (previousCount / wordCount) * 100;

         // Skip if already at target
         if (previousDensity >= input.targetDensity) {
            results.push({
               keyword,
               previousCount,
               newCount: previousCount,
               locations: ["already optimal"],
            });
            continue;
         }

         // Calculate how many more occurrences needed
         const targetOccurrences = Math.ceil(
            (input.targetDensity / 100) * wordCount,
         );
         const neededOccurrences = targetOccurrences - previousCount;

         const locations: string[] = [];
         let addedCount = 0;

         // Strategy 1: Add to H2 heading (if not present)
         if (addedCount < neededOccurrences) {
            const h2WithoutKeyword = content.match(/^(## )([^\n]+)$/m);
            const h2Text = h2WithoutKeyword?.[2];
            if (
               h2WithoutKeyword &&
               h2Text &&
               !h2Text.toLowerCase().includes(keyword.toLowerCase())
            ) {
               content = content.replace(
                  h2WithoutKeyword[0],
                  `${h2WithoutKeyword[1]}${keyword}: ${h2Text}`,
               );
               locations.push("H2 heading");
               addedCount++;
            }
         }

         // Strategy 2: Add to first paragraph (if not present)
         if (addedCount < neededOccurrences) {
            const firstParaMatch = content.match(/^([^#\n][^\n]+)/);
            const firstPara = firstParaMatch?.[1];
            if (
               firstParaMatch &&
               firstPara &&
               !firstPara.toLowerCase().includes(keyword.toLowerCase())
            ) {
               content = content.replace(
                  firstParaMatch[0],
                  `${firstParaMatch[0]} Neste artigo sobre ${keyword}, você encontrará informações essenciais.`,
               );
               locations.push("first paragraph");
               addedCount++;
            }
         }

         // Strategy 3: Replace generic terms
         const genericTerms = [
            "o tema",
            "este assunto",
            "a questão",
            "esse tópico",
         ];
         for (const term of genericTerms) {
            if (addedCount >= neededOccurrences) break;
            if (content.includes(term)) {
               content = content.replace(term, keyword);
               locations.push(`replaced "${term}"`);
               addedCount++;
            }
         }

         // Strategy 4: Add before conclusion
         if (addedCount < neededOccurrences) {
            const conclusionMatch = content.match(
               /^(## (?:Conclusão|Resumo|Considerações|Conclusion|Summary))/m,
            );
            if (conclusionMatch) {
               const insertPoint = content.indexOf(conclusionMatch[0]);
               const insertion = `\n\n**Resumo sobre ${keyword}:** Os pontos apresentados demonstram a importância de entender ${keyword} para aplicar corretamente.\n`;
               content =
                  content.slice(0, insertPoint) +
                  insertion +
                  content.slice(insertPoint);
               locations.push("before conclusion");
               addedCount++;
            }
         }

         const newCount = (content.match(regex) || []).length;
         results.push({
            keyword,
            previousCount,
            newCount,
            locations,
         });
      }

      const newWordCount = content.split(/\s+/).filter(Boolean).length;
      const totalKeywordOccurrences = input.keywords.reduce((sum, kw) => {
         return sum + (content.match(new RegExp(kw, "gi")) || []).length;
      }, 0);

      return {
         success: true,
         modifiedContent: content,
         keywordsInjected: results,
         densityBefore,
         densityAfter: (totalKeywordOccurrences / newWordCount) * 100,
      };
   },
});

export function getInjectKeywordsInstructions(): string {
   return `
## INJECT KEYWORDS TOOL
Automatically injects missing keywords into content to achieve target keyword density.

**When to use:** After seoScore shows "keyword_density" issues with missing or low keywords.

**Input:**
- content (string): Current blog content
- keywords (array): Array of keywords to inject
- targetDensity (number): Target density percentage (default 1.5)
- preserveReadability (boolean): Whether to preserve readability (default true)

**Output:**
- success: Whether the operation succeeded
- modifiedContent: Content with keywords injected
- keywordsInjected: Details of what was added and where
- densityBefore: Keyword density before injection
- densityAfter: Keyword density after injection

**Injection strategies:**
1. Add keyword to H2 headings
2. Add context phrase to first paragraph
3. Replace generic terms ("o tema", "este assunto", etc.)
4. Add summary before conclusion

**Example:**
\`\`\`json
{
  "content": "Your current content...",
  "keywords": ["SEO 2026", "mudanças SEO", "estratégia SEO"],
  "targetDensity": 1.5
}
\`\`\`
`;
}
