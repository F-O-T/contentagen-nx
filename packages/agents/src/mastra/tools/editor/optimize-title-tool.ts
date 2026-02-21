import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const OptimizeTitleInputSchema = z.object({
   currentTitle: z.string().describe("Current title to optimize"),
   primaryKeyword: z.string().describe("Primary keyword to include"),
   secondaryKeywords: z
      .array(z.string())
      .optional()
      .describe("Optional secondary keywords"),
   style: z
      .enum(["how-to", "listicle", "guide", "question", "statement"])
      .optional()
      .default("statement")
      .describe("Title style"),
});

const OptimizeTitleOutputSchema = z.object({
   success: z.boolean(),
   originalTitle: z.string(),
   optimizedTitle: z.string(),
   alternativeTitles: z.array(z.string()),
   changes: z.array(z.string()),
   score: z.object({
      before: z.number(),
      after: z.number(),
   }),
});

// Power words by language
const POWER_WORDS_PT = [
   "Guia Completo",
   "Definitivo",
   "Essencial",
   "Prático",
   "Atualizado",
   "Passo a Passo",
   "Fundamental",
];

const POWER_WORDS_EN = [
   "Complete Guide",
   "Ultimate",
   "Essential",
   "Practical",
   "Updated",
   "Step-by-Step",
   "Comprehensive",
];

// Style prefixes
const STYLE_PREFIXES: Record<string, { pt: string[]; en: string[] }> = {
   "how-to": {
      pt: ["Como", "Como Fazer"],
      en: ["How to", "How To"],
   },
   listicle: {
      pt: ["X Melhores", "Top X", "X Dicas de"],
      en: ["X Best", "Top X", "X Tips for"],
   },
   guide: {
      pt: ["Guia Completo:", "Guia Definitivo:"],
      en: ["Complete Guide:", "Ultimate Guide:"],
   },
   question: {
      pt: ["O Que É", "Por Que", "Quando"],
      en: ["What Is", "Why", "When"],
   },
   statement: {
      pt: [],
      en: [],
   },
};

function detectLanguage(text: string): "pt" | "en" {
   // Simple heuristic based on common Portuguese words
   const ptIndicators = /\b(de|da|do|em|para|que|como|é|são|está|um|uma)\b/i;
   return ptIndicators.test(text) ? "pt" : "en";
}

function calculateTitleScore(title: string, keyword: string): number {
   let score = 100;
   const lowerTitle = title.toLowerCase();
   const lowerKeyword = keyword.toLowerCase();

   // Length check
   if (title.length < 30) score -= 20;
   else if (title.length < 50) score -= 10;
   else if (title.length > 70) score -= 15;
   else if (title.length > 60) score -= 5;

   // Keyword presence and position
   if (!lowerTitle.includes(lowerKeyword)) {
      score -= 25;
   } else {
      const keywordIndex = lowerTitle.indexOf(lowerKeyword);
      if (keywordIndex > title.length * 0.5) {
         score -= 10; // Keyword too late
      }
   }

   return Math.max(0, score);
}

function insertKeywordAtStart(title: string, keyword: string): string {
   const lowerTitle = title.toLowerCase();
   const lowerKeyword = keyword.toLowerCase();

   // If keyword already at start, return as is
   if (lowerTitle.startsWith(lowerKeyword)) {
      return title;
   }

   // If keyword is in title but not at start, try to restructure
   if (lowerTitle.includes(lowerKeyword)) {
      // Find the keyword position and try to move content
      const keywordIndex = lowerTitle.indexOf(lowerKeyword);
      const keywordEnd = keywordIndex + keyword.length;

      // Extract keyword with original case
      const originalKeyword = title.slice(keywordIndex, keywordEnd);

      // Try to create a natural restructure
      const beforeKeyword = title.slice(0, keywordIndex).trim();
      const afterKeyword = title.slice(keywordEnd).trim();

      // Simple restructure: keyword + colon + rest
      if (beforeKeyword && afterKeyword) {
         return `${originalKeyword}: ${beforeKeyword} ${afterKeyword}`
            .replace(/\s+/g, " ")
            .trim();
      }
      if (afterKeyword) {
         return `${originalKeyword}: ${afterKeyword}`;
      }
   }

   // Keyword not in title - prepend it
   return `${keyword}: ${title}`;
}

function generateAlternatives(
   _title: string,
   keyword: string,
   style: string,
   language: "pt" | "en",
   secondaryKeywords: string[] = [],
): string[] {
   const alternatives: string[] = [];
   const prefixes = STYLE_PREFIXES[style] || STYLE_PREFIXES.statement;
   const powerWords = language === "pt" ? POWER_WORDS_PT : POWER_WORDS_EN;

   // Add style prefix if applicable
   const stylePrefixList =
      (language === "pt" ? prefixes?.pt : prefixes?.en) ?? [];
   for (const prefix of stylePrefixList.slice(0, 2)) {
      const withPrefix = prefix.includes("X")
         ? `${prefix.replace("X", "10")} ${keyword}`
         : `${prefix} ${keyword}`;

      if (withPrefix.length <= 65) {
         alternatives.push(withPrefix);
      }
   }

   // Add power word variations
   for (const powerWord of powerWords.slice(0, 3)) {
      const withPower = `${keyword}: ${powerWord}`;
      if (withPower.length <= 65 && !alternatives.includes(withPower)) {
         alternatives.push(withPower);
      }
   }

   // Add secondary keyword variation
   if (secondaryKeywords.length > 0) {
      const secondary = secondaryKeywords[0];
      if (secondary) {
         const combined = `${keyword} e ${secondary}: Guia Completo`;
         if (combined.length <= 65) {
            alternatives.push(combined);
         }
      }
   }

   // Filter out titles that are too long
   return alternatives.filter((alt) => alt.length <= 70).slice(0, 4);
}

export const optimizeTitleTool = createTool({
   id: "optimizeTitle",
   description:
      "Optimize a title to include keywords at the start and improve SEO effectiveness.",
   inputSchema: OptimizeTitleInputSchema,
   outputSchema: OptimizeTitleOutputSchema,
   execute: async (input) => {
      const { currentTitle, primaryKeyword, secondaryKeywords, style } = input;

      const changes: string[] = [];
      const language = detectLanguage(currentTitle);

      // Calculate before score
      const beforeScore = calculateTitleScore(currentTitle, primaryKeyword);

      // Generate optimized title
      let optimizedTitle = currentTitle;

      // Check if keyword is missing or not at start
      const lowerTitle = currentTitle.toLowerCase();
      const lowerKeyword = primaryKeyword.toLowerCase();

      if (!lowerTitle.includes(lowerKeyword)) {
         optimizedTitle = insertKeywordAtStart(currentTitle, primaryKeyword);
         changes.push(`Added keyword "${primaryKeyword}" at the start`);
      } else if (!lowerTitle.startsWith(lowerKeyword)) {
         optimizedTitle = insertKeywordAtStart(currentTitle, primaryKeyword);
         changes.push(`Moved keyword "${primaryKeyword}" to the start`);
      }

      // Check length and truncate if needed
      if (optimizedTitle.length > 65) {
         // Try to shorten while keeping keyword
         const keywordEnd =
            optimizedTitle.toLowerCase().indexOf(lowerKeyword) +
            primaryKeyword.length;
         const afterKeyword = optimizedTitle.slice(keywordEnd).trim();

         if (afterKeyword.startsWith(":")) {
            // Find a natural break point
            const shortened = afterKeyword.slice(1).trim();
            const words = shortened.split(" ");
            let result = `${primaryKeyword}:`;

            for (const word of words) {
               if (`${result} ${word}`.length <= 60) {
                  result += ` ${word}`;
               } else {
                  break;
               }
            }
            optimizedTitle = result;
            changes.push("Shortened title to fit within 60 characters");
         }
      }

      // Calculate after score
      const afterScore = calculateTitleScore(optimizedTitle, primaryKeyword);

      // Generate alternatives
      const alternativeTitles = generateAlternatives(
         currentTitle,
         primaryKeyword,
         style || "statement",
         language,
         secondaryKeywords || [],
      );

      return {
         success: afterScore > beforeScore || afterScore >= 80,
         originalTitle: currentTitle,
         optimizedTitle,
         alternativeTitles,
         changes:
            changes.length > 0
               ? changes
               : ["No changes needed - title is already optimized"],
         score: {
            before: beforeScore,
            after: afterScore,
         },
      };
   },
});
