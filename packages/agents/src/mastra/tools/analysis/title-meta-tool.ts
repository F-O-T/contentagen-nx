import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const TitleAnalysisSchema = z.object({
   score: z.number().min(0).max(100),
   hasKeyword: z.boolean(),
   keywordPosition: z.enum(["start", "middle", "end", "missing"]),
   length: z.number(),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
});

const MetaAnalysisSchema = z.object({
   score: z.number().min(0).max(100),
   hasKeyword: z.boolean(),
   hasCTA: z.boolean(),
   length: z.number(),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
});

const TitleMetaInputSchema = z.object({
   title: z.string().describe("Content title"),
   metaDescription: z.string().describe("Meta description"),
   primaryKeyword: z.string().describe("Primary target keyword"),
   secondaryKeywords: z
      .array(z.string())
      .optional()
      .describe("Optional secondary keywords"),
});

const TitleMetaOutputSchema = z.object({
   titleAnalysis: TitleAnalysisSchema,
   metaAnalysis: MetaAnalysisSchema,
   overallScore: z.number().min(0).max(100),
});

// CTA patterns in Portuguese and English
const CTA_PATTERNS = [
   /\b(descubra|aprenda|confira|saiba|veja|conhe[cç]a|entenda|domine)\b/i,
   /\b(discover|learn|check|find out|see|explore|master|understand)\b/i,
   /\b(guia|tutorial|passo a passo|como|dicas)\b/i,
   /\b(guide|tutorial|step by step|how to|tips)\b/i,
];

function findKeywordPosition(
   text: string,
   keyword: string,
): "start" | "middle" | "end" | "missing" {
   const lowerText = text.toLowerCase();
   const lowerKeyword = keyword.toLowerCase();

   if (!lowerText.includes(lowerKeyword)) {
      return "missing";
   }

   const index = lowerText.indexOf(lowerKeyword);
   const textLength = text.length;
   const keywordLength = keyword.length;

   // Start: keyword in first 30% of title
   if (index < textLength * 0.3) {
      return "start";
   }

   // End: keyword starts in last 30% of title
   if (index + keywordLength > textLength * 0.7) {
      return "end";
   }

   return "middle";
}

function hasCTA(text: string): boolean {
   return CTA_PATTERNS.some((pattern) => pattern.test(text));
}

function analyzeTitle(
   title: string,
   primaryKeyword: string,
   secondaryKeywords: string[] = [],
): z.infer<typeof TitleAnalysisSchema> {
   const issues: string[] = [];
   const suggestions: string[] = [];
   let score = 100;

   const length = title.length;
   const hasKeyword = title
      .toLowerCase()
      .includes(primaryKeyword.toLowerCase());
   const keywordPosition = findKeywordPosition(title, primaryKeyword);

   // Length check (ideal: 50-60 chars)
   if (length < 30) {
      issues.push("Title is too short (< 30 characters)");
      suggestions.push("Expand title to 50-60 characters for optimal display");
      score -= 20;
   } else if (length < 50) {
      issues.push("Title is slightly short (< 50 characters)");
      suggestions.push("Consider expanding to 50-60 characters");
      score -= 10;
   } else if (length > 70) {
      issues.push("Title may be truncated in search results (> 70 characters)");
      suggestions.push("Shorten title to 50-60 characters");
      score -= 15;
   } else if (length > 60) {
      issues.push("Title is slightly long (> 60 characters)");
      score -= 5;
   }

   // Keyword presence and position
   if (!hasKeyword) {
      issues.push("Primary keyword not found in title");
      suggestions.push(
         `Include "${primaryKeyword}" in the title, preferably at the beginning`,
      );
      score -= 25;
   } else {
      switch (keywordPosition) {
         case "start":
            // Best position, no penalty
            break;
         case "middle":
            suggestions.push(
               "Consider moving the primary keyword closer to the beginning",
            );
            score -= 5;
            break;
         case "end":
            issues.push("Primary keyword is at the end of the title");
            suggestions.push(
               "Move the primary keyword to the beginning for better visibility",
            );
            score -= 10;
            break;
      }
   }

   // Check for secondary keywords (bonus)
   const hasSecondary = secondaryKeywords.some((kw) =>
      title.toLowerCase().includes(kw.toLowerCase()),
   );
   if (!hasSecondary && secondaryKeywords.length > 0) {
      suggestions.push(
         "Consider including a secondary keyword if it fits naturally",
      );
   }

   // Check for power words
   const powerWords =
      /\b(guia|completo|definitivo|essencial|melhor|top|novo|atualizado|ultimate|best|complete|essential|new|updated)\b/i;
   if (!powerWords.test(title)) {
      suggestions.push(
         'Consider adding a power word like "Guia Completo", "Essencial", or "Definitivo"',
      );
   }

   return {
      score: Math.max(0, score),
      hasKeyword,
      keywordPosition,
      length,
      issues,
      suggestions,
   };
}

function analyzeMeta(
   metaDescription: string,
   primaryKeyword: string,
): z.infer<typeof MetaAnalysisSchema> {
   const issues: string[] = [];
   const suggestions: string[] = [];
   let score = 100;

   const length = metaDescription.length;
   const hasKeyword = metaDescription
      .toLowerCase()
      .includes(primaryKeyword.toLowerCase());
   const ctaPresent = hasCTA(metaDescription);

   // Length check (ideal: 150-160 chars)
   if (length < 70) {
      issues.push("Meta description is too short (< 70 characters)");
      suggestions.push(
         "Expand meta description to 150-160 characters for better CTR",
      );
      score -= 25;
   } else if (length < 120) {
      issues.push("Meta description is short (< 120 characters)");
      suggestions.push("Consider expanding to 150-160 characters");
      score -= 15;
   } else if (length > 170) {
      issues.push(
         "Meta description will be truncated in search results (> 170 characters)",
      );
      suggestions.push("Shorten to 150-160 characters");
      score -= 15;
   } else if (length > 160) {
      issues.push("Meta description is slightly long (> 160 characters)");
      score -= 5;
   }

   // Keyword presence
   if (!hasKeyword) {
      issues.push("Primary keyword not found in meta description");
      suggestions.push(
         `Include "${primaryKeyword}" naturally in the description`,
      );
      score -= 20;
   }

   // CTA presence
   if (!ctaPresent) {
      issues.push("No call-to-action detected in meta description");
      suggestions.push(
         'Add a CTA like "Descubra", "Aprenda", "Confira" to increase click-through rate',
      );
      score -= 15;
   }

   // Check for unique value proposition
   const valueProps =
      /\b(grátis|gratuito|rápido|fácil|simples|completo|exclusivo|free|fast|easy|simple|complete|exclusive)\b/i;
   if (!valueProps.test(metaDescription)) {
      suggestions.push(
         "Consider highlighting a unique value proposition (e.g., free, complete, easy)",
      );
   }

   return {
      score: Math.max(0, score),
      hasKeyword,
      hasCTA: ctaPresent,
      length,
      issues,
      suggestions,
   };
}

export const titleMetaTool = createTool({
   id: "titleMeta",
   description:
      "Analyze title and meta description for SEO optimization. Checks keyword placement, length, and CTA presence.",
   inputSchema: TitleMetaInputSchema,
   outputSchema: TitleMetaOutputSchema,
   execute: async (input) => {
      const { title, metaDescription, primaryKeyword, secondaryKeywords } =
         input;

      const titleAnalysis = analyzeTitle(
         title,
         primaryKeyword,
         secondaryKeywords || [],
      );
      const metaAnalysis = analyzeMeta(metaDescription, primaryKeyword);

      // Overall score is weighted average (title: 60%, meta: 40%)
      const overallScore = Math.round(
         titleAnalysis.score * 0.6 + metaAnalysis.score * 0.4,
      );

      return {
         titleAnalysis,
         metaAnalysis,
         overallScore,
      };
   },
});

export function getTitleMetaInstructions(): string {
   return `
## TITLE & META ANALYSIS TOOL
Analyzes title and meta description for SEO optimization.

**When to use:** Before publishing content to ensure title and meta are optimized for search.

**Input:**
- title (string): The content title
- metaDescription (string): The meta description
- primaryKeyword (string): The main keyword to target
- secondaryKeywords (array, optional): Additional keywords to check

**Output:**
- titleAnalysis: Score (0-100), keyword presence/position, length, issues, suggestions
- metaAnalysis: Score (0-100), keyword presence, CTA presence, length, issues, suggestions
- overallScore: Combined score (title 60%, meta 40%)

**Best Practices:**
- Title: 50-60 characters, keyword at the beginning, include power words
- Meta: 150-160 characters, include keyword, add a CTA

**Example:**
\`\`\`json
{
  "title": "SEO em 2026: O Que Muda e Como se Adaptar",
  "metaDescription": "Descubra as mudanças no SEO para 2026...",
  "primaryKeyword": "SEO 2026",
  "secondaryKeywords": ["mudanças SEO", "otimização"]
}
\`\`\`
`;
}
