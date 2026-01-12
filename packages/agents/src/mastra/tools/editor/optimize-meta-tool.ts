import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const OptimizeMetaInputSchema = z.object({
   currentMeta: z
      .string()
      .nullable()
      .describe("Current meta description or null to generate"),
   primaryKeyword: z.string().describe("Primary keyword to include"),
   contentSummary: z
      .string()
      .describe("First 200 words of content for context"),
   includeCTA: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include call-to-action"),
});

const OptimizeMetaOutputSchema = z.object({
   success: z.boolean(),
   originalMeta: z.string(),
   optimizedMeta: z.string(),
   alternativeMetas: z.array(z.string()),
   changes: z.array(z.string()),
   score: z.object({
      before: z.number(),
      after: z.number(),
   }),
});

// CTAs by language
const CTAS_PT = [
   "Descubra",
   "Aprenda",
   "Confira",
   "Saiba",
   "Veja",
   "Conheça",
   "Entenda",
];

const CTAS_EN = [
   "Discover",
   "Learn",
   "Check out",
   "Find out",
   "See",
   "Explore",
   "Understand",
];

// Value propositions
const VALUE_PROPS_PT = [
   "guia completo",
   "passo a passo",
   "dicas práticas",
   "estratégias comprovadas",
   "tudo o que você precisa saber",
];

const VALUE_PROPS_EN = [
   "complete guide",
   "step by step",
   "practical tips",
   "proven strategies",
   "everything you need to know",
];

function detectLanguage(text: string): "pt" | "en" {
   const ptIndicators = /\b(de|da|do|em|para|que|como|é|são|está|um|uma)\b/i;
   return ptIndicators.test(text) ? "pt" : "en";
}

function calculateMetaScore(meta: string, keyword: string): number {
   if (!meta || meta.trim() === "") return 0;

   let score = 100;
   const lowerMeta = meta.toLowerCase();
   const lowerKeyword = keyword.toLowerCase();

   // Length check (ideal: 150-160)
   if (meta.length < 70) score -= 25;
   else if (meta.length < 120) score -= 15;
   else if (meta.length > 170) score -= 15;
   else if (meta.length > 160) score -= 5;

   // Keyword presence
   if (!lowerMeta.includes(lowerKeyword)) {
      score -= 20;
   }

   // CTA presence
   const hasCTA =
      /\b(descubra|aprenda|confira|saiba|veja|conheça|discover|learn|find out|explore)\b/i.test(
         meta,
      );
   if (!hasCTA) {
      score -= 15;
   }

   return Math.max(0, score);
}

function extractKeyPoints(summary: string, maxPoints: number = 3): string[] {
   // Extract sentences that might contain key points
   const sentences = summary
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 100);

   // Prioritize sentences with numbers or strong statements
   const scored = sentences.map((sentence) => {
      let priority = 0;
      if (/\d+/.test(sentence)) priority += 2; // Has numbers
      if (
         /\b(importante|essencial|fundamental|key|essential|important)\b/i.test(
            sentence,
         )
      )
         priority += 1;
      if (
         /\b(novo|nova|mudou|transformou|new|changed|transformed)\b/i.test(
            sentence,
         )
      )
         priority += 1;
      return { sentence, priority };
   });

   return scored
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxPoints)
      .map((s) => s.sentence);
}

function generateMeta(
   keyword: string,
   summary: string,
   language: "pt" | "en",
   includeCTA: boolean,
): string {
   const ctas = language === "pt" ? CTAS_PT : CTAS_EN;
   const valueProps = language === "pt" ? VALUE_PROPS_PT : VALUE_PROPS_EN;

   const keyPoints = extractKeyPoints(summary);
   const cta = includeCTA ? ctas[Math.floor(Math.random() * ctas.length)] : "";
   const valueProp = valueProps[Math.floor(Math.random() * valueProps.length)];

   let meta: string;

   if (keyPoints.length > 0) {
      // Use extracted key point
      const keyPoint = keyPoints[0] || "";
      if (includeCTA) {
         meta =
            language === "pt"
               ? `${cta} ${keyPoint.toLowerCase()}. ${valueProp} sobre ${keyword}.`
               : `${cta} ${keyPoint.toLowerCase()}. ${valueProp} on ${keyword}.`;
      } else {
         meta = `${keyPoint}. ${valueProp} sobre ${keyword}.`;
      }
   } else {
      // Generic but keyword-focused
      meta =
         language === "pt"
            ? `${cta} tudo sobre ${keyword}. ${valueProp} para você aplicar hoje.`
            : `${cta} everything about ${keyword}. ${valueProp} to apply today.`;
   }

   // Ensure length is appropriate
   if (meta.length > 160) {
      // Truncate at last complete word before 155 chars
      meta = meta.slice(0, 155);
      const lastSpace = meta.lastIndexOf(" ");
      meta = meta.slice(0, lastSpace) + "...";
   }

   return meta.charAt(0).toUpperCase() + meta.slice(1);
}

function improveMeta(
   currentMeta: string,
   keyword: string,
   language: "pt" | "en",
   includeCTA: boolean,
): { improved: string; changes: string[] } {
   const changes: string[] = [];
   let improved = currentMeta;
   const lowerMeta = currentMeta.toLowerCase();
   const lowerKeyword = keyword.toLowerCase();

   // Add keyword if missing
   if (!lowerMeta.includes(lowerKeyword)) {
      // Try to insert naturally at the beginning
      improved = `${keyword}: ${improved}`;
      changes.push(`Added keyword "${keyword}"`);
   }

   // Add CTA if missing and requested
   if (includeCTA) {
      const hasCTA =
         /\b(descubra|aprenda|confira|saiba|veja|discover|learn|find out|explore)\b/i.test(
            improved,
         );
      if (!hasCTA) {
         const ctas = language === "pt" ? CTAS_PT : CTAS_EN;
         const cta = ctas[0] || "Descubra";
         improved = `${cta} ${improved.charAt(0).toLowerCase()}${improved.slice(1)}`;
         changes.push("Added call-to-action");
      }
   }

   // Fix length issues
   if (improved.length < 100) {
      const valueProps = language === "pt" ? VALUE_PROPS_PT : VALUE_PROPS_EN;
      const prop = valueProps[0] || "guia completo";
      improved = `${improved} - ${prop}.`;
      changes.push("Extended meta description for better length");
   } else if (improved.length > 165) {
      improved = improved.slice(0, 155);
      const lastSpace = improved.lastIndexOf(" ");
      improved = improved.slice(0, lastSpace) + "...";
      changes.push("Shortened to fit within 160 characters");
   }

   return { improved, changes };
}

function generateAlternatives(
   keyword: string,
   summary: string,
   language: "pt" | "en",
): string[] {
   const alternatives: string[] = [];
   const ctas = language === "pt" ? CTAS_PT : CTAS_EN;
   const valueProps = language === "pt" ? VALUE_PROPS_PT : VALUE_PROPS_EN;
   const keyPoints = extractKeyPoints(summary, 3);

   // Generate variations with different CTAs and value props
   for (let i = 0; i < Math.min(3, ctas.length); i++) {
      const cta = ctas[i];
      const valueProp = valueProps[i % valueProps.length];
      const keyPoint = keyPoints[i % keyPoints.length] || keyword;

      let meta =
         language === "pt"
            ? `${cta} ${keyPoint.toLowerCase()}. ${valueProp} sobre ${keyword}.`
            : `${cta} ${keyPoint.toLowerCase()}. ${valueProp} on ${keyword}.`;

      if (meta.length > 160) {
         meta = meta.slice(0, 155);
         const lastSpace = meta.lastIndexOf(" ");
         meta = meta.slice(0, lastSpace) + "...";
      }

      alternatives.push(meta.charAt(0).toUpperCase() + meta.slice(1));
   }

   return alternatives;
}

export const optimizeMetaTool = createTool({
   id: "optimizeMeta",
   description:
      "Generate or optimize meta descriptions with keywords and CTAs.",
   inputSchema: OptimizeMetaInputSchema,
   outputSchema: OptimizeMetaOutputSchema,
   execute: async (input) => {
      const { currentMeta, primaryKeyword, contentSummary, includeCTA } = input;

      const language = detectLanguage(contentSummary);
      const changes: string[] = [];

      // Calculate before score
      const beforeScore = currentMeta
         ? calculateMetaScore(currentMeta, primaryKeyword)
         : 0;

      let optimizedMeta: string;

      if (!currentMeta || currentMeta.trim() === "") {
         // Generate new meta
         optimizedMeta = generateMeta(
            primaryKeyword,
            contentSummary,
            language,
            includeCTA ?? true,
         );
         changes.push("Generated new meta description from content");
      } else {
         // Improve existing meta
         const result = improveMeta(
            currentMeta,
            primaryKeyword,
            language,
            includeCTA ?? true,
         );
         optimizedMeta = result.improved;
         changes.push(...result.changes);
      }

      // Calculate after score
      const afterScore = calculateMetaScore(optimizedMeta, primaryKeyword);

      // Generate alternatives
      const alternativeMetas = generateAlternatives(
         primaryKeyword,
         contentSummary,
         language,
      );

      return {
         success: afterScore > beforeScore || afterScore >= 80,
         originalMeta: currentMeta || "",
         optimizedMeta,
         alternativeMetas,
         changes:
            changes.length > 0
               ? changes
               : ["No changes needed - meta is already optimized"],
         score: {
            before: beforeScore,
            after: afterScore,
         },
      };
   },
});

export function getOptimizeMetaInstructions(): string {
   return `
## OPTIMIZE META DESCRIPTION TOOL
Generates or improves meta descriptions with keywords and CTAs.

**When to use:** After titleMeta analysis shows meta issues or when meta is missing.

**Input:**
- currentMeta (string | null): Existing meta or null to generate new
- primaryKeyword (string): Keyword to include
- contentSummary (string): First 200 words for context
- includeCTA (boolean): Add call-to-action (default: true)

**Output:**
- success: Whether optimization succeeded
- originalMeta: Input meta
- optimizedMeta: Improved meta
- alternativeMetas: Additional suggestions
- changes: What was modified
- score: Before/after scores (0-100)

**Optimization Strategy:**
1. Generate from content summary if meta is null
2. Add keyword if missing
3. Add CTA ("Descubra", "Aprenda", etc.)
4. Ensure 150-160 character length
5. Extract key points from content for relevance

**Example:**
Input: null, keyword: "SEO 2026", summary: "O SEO em 2026 mudou..."
Output: "Descubra como o SEO em 2026 mudou. Guia completo com estratégias..."
`;
}
