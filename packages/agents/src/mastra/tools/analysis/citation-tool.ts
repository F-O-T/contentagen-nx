import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const StatisticInfoSchema = z.object({
   text: z.string(),
   value: z.string(),
   hasCitation: z.boolean(),
   citationType: z.enum(["inline_link", "footnote", "attribution", "none"]),
   suggestedSearchQuery: z.string().optional(),
});

const QuoteInfoSchema = z.object({
   text: z.string(),
   attribution: z.string().nullable(),
   isVerifiable: z.boolean(),
   concern: z.string().nullable(),
});

const ClaimInfoSchema = z.object({
   text: z.string(),
   needsCitation: z.boolean(),
   reason: z.string(),
});

const CitationInputSchema = z.object({
   content: z.string().describe("Full content"),
});

const CitationOutputSchema = z.object({
   statistics: z.array(StatisticInfoSchema),
   quotes: z.array(QuoteInfoSchema),
   claims: z.array(ClaimInfoSchema),
   score: z.number().min(0).max(100),
   uncitedCount: z.number(),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
});

// Statistics patterns (numbers with context)
const STATISTIC_PATTERNS = [
   // Percentages
   {
      pattern: /(\d+(?:[,.]\d+)?)\s*%\s+(?:dos?|das?|de|of|from)/gi,
      extract: (match: string) => match,
   },
   // Large numbers (bilhões, milhões)
   {
      pattern:
         /(\d+(?:[,.]\d+)?)\s*(?:bilh[õo]es?|milh[õo]es?|mil|billion|million|thousand)/gi,
      extract: (match: string) => match,
   },
   // "X em cada Y" or "X out of Y"
   {
      pattern: /(\d+)\s+(?:em\s+cada|out\s+of|de\s+cada)\s+(\d+)/gi,
      extract: (match: string) => match,
   },
   // Year references with claims
   {
      pattern: /(?:em|in|desde|since)\s+20\d{2}[,\s]+(?:\d+)/gi,
      extract: (match: string) => match,
   },
];

// Quote patterns (text in quotes with attribution)
const QUOTE_PATTERN =
   /"([^"]{10,200})"\s*(?:[-–—]\s*|,\s*(?:disse|diz|says|said|according to)\s*)?([^,.\n]{0,50})?/gi;

// Claims that need citation
const CLAIM_PATTERNS = [
   {
      pattern: /estudos\s+(?:mostram|indicam|revelam|comprovam)/gi,
      reason: "Studies should be cited specifically",
   },
   {
      pattern: /pesquisas?\s+(?:mostram?|indicam?|revelam?)/gi,
      reason: "Research should reference specific sources",
   },
   {
      pattern:
         /(?:segundo|de acordo com)\s+(?:especialistas|experts|pesquisadores)/gi,
      reason: "Experts should be named and cited",
   },
   {
      pattern:
         /(?:cientistas|researchers)\s+(?:descobriram|found|discovered)/gi,
      reason: "Scientific claims need specific citations",
   },
   {
      pattern: /é\s+(?:comprovado|provado|científico)\s+que/gi,
      reason: "Proven claims require source",
   },
   {
      pattern: /(?:a maioria|most|majority)\s+(?:dos?|of)\s+/gi,
      reason: "Majority claims should cite data",
   },
];

// Check if text has citation nearby
function hasCitationNearby(
   content: string,
   matchIndex: number,
): {
   hasCitation: boolean;
   type: "inline_link" | "footnote" | "attribution" | "none";
} {
   // Get surrounding context (200 chars before and after)
   const start = Math.max(0, matchIndex - 100);
   const end = Math.min(content.length, matchIndex + 200);
   const context = content.slice(start, end);

   // Check for inline link [text](url)
   if (/\[[^\]]+\]\([^)]+\)/.test(context)) {
      return { hasCitation: true, type: "inline_link" };
   }

   // Check for footnote [1] or [^1]
   if (/\[\^?\d+\]/.test(context)) {
      return { hasCitation: true, type: "footnote" };
   }

   // Check for attribution (source:, according to, de acordo com)
   if (
      /(?:source|fonte|according to|de acordo com|segundo)\s*:/i.test(context)
   ) {
      return { hasCitation: true, type: "attribution" };
   }

   return { hasCitation: false, type: "none" };
}

function generateSearchQuery(statistic: string): string {
   // Extract numbers and context words
   const numbers = statistic.match(/\d+(?:[,.]\d+)?/g) || [];
   const keywords = statistic
      .replace(/\d+(?:[,.]\d+)?/g, "")
      .replace(/[%]/g, " percent")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4);

   return [...numbers.slice(0, 2), ...keywords].join(" ") + " source study";
}

function assessQuoteVerifiability(
   _quote: string,
   attribution: string | null,
): { isVerifiable: boolean; concern: string | null } {
   if (!attribution || attribution.trim() === "") {
      return { isVerifiable: false, concern: "Quote has no attribution" };
   }

   const trimmedAttr = attribution.trim();

   // Generic attributions are not verifiable
   const genericAttributions = [
      /^(?:especialista|expert|profissional|professional)s?$/i,
      /^(?:alguém|someone|they|eles)$/i,
      /^(?:um|uma|a|an)\s+(?:especialista|expert)/i,
   ];

   if (genericAttributions.some((p) => p.test(trimmedAttr))) {
      return {
         isVerifiable: false,
         concern: `Generic attribution "${trimmedAttr}" - name the specific expert`,
      };
   }

   // Check if it looks like a real name (capitalized words)
   const hasProperName = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(trimmedAttr);
   if (!hasProperName) {
      return {
         isVerifiable: false,
         concern: "Attribution doesn't appear to be a specific person's name",
      };
   }

   return { isVerifiable: true, concern: null };
}

export const citationTool = createTool({
   id: "citation",
   description:
      "Verify if statistics, quotes, and claims have proper citations.",
   inputSchema: CitationInputSchema,
   outputSchema: CitationOutputSchema,
   execute: async (input) => {
      const { content } = input;

      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      const statistics: z.infer<typeof CitationOutputSchema>["statistics"] = [];
      const quotes: z.infer<typeof CitationOutputSchema>["quotes"] = [];
      const claims: z.infer<typeof CitationOutputSchema>["claims"] = [];

      // Find statistics
      for (const { pattern } of STATISTIC_PATTERNS) {
         let match: RegExpExecArray | null;
         // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
         while ((match = pattern.exec(content)) !== null) {
            const text = match[0];
            const matchIndex = match.index;
            const { hasCitation, type } = hasCitationNearby(
               content,
               matchIndex,
            );

            statistics.push({
               text,
               value: text.match(/\d+(?:[,.]\d+)?/)?.[0] || text,
               hasCitation,
               citationType: type,
               suggestedSearchQuery: hasCitation
                  ? undefined
                  : generateSearchQuery(text),
            });
         }
      }

      // Find quotes
      let quoteMatch: RegExpExecArray | null;
      // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
      while ((quoteMatch = QUOTE_PATTERN.exec(content)) !== null) {
         const quoteText = quoteMatch[1] || "";
         const attribution = quoteMatch[2]?.trim() || null;
         const { isVerifiable, concern } = assessQuoteVerifiability(
            quoteText,
            attribution,
         );

         quotes.push({
            text:
               quoteText.length > 100
                  ? `${quoteText.slice(0, 100)}...`
                  : quoteText,
            attribution,
            isVerifiable,
            concern,
         });
      }

      // Find claims needing citation
      for (const { pattern, reason } of CLAIM_PATTERNS) {
         let match: RegExpExecArray | null;
         // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
         while ((match = pattern.exec(content)) !== null) {
            const text = match[0];
            const matchIndex = match.index;
            const { hasCitation } = hasCitationNearby(content, matchIndex);

            claims.push({
               text,
               needsCitation: !hasCitation,
               reason,
            });
         }
      }

      // Calculate uncited count
      const uncitedStats = statistics.filter((s) => !s.hasCitation).length;
      const unverifiableQuotes = quotes.filter((q) => !q.isVerifiable).length;
      const uncitedClaims = claims.filter((c) => c.needsCitation).length;
      const uncitedCount = uncitedStats + uncitedClaims;

      // Generate issues and suggestions
      if (uncitedStats > 0) {
         issues.push(`${uncitedStats} statistic(s) without citations`);
         suggestions.push(
            "Add source links for statistics to build credibility",
         );
         score -= uncitedStats * 10;
      }

      if (unverifiableQuotes > 0) {
         issues.push(
            `${unverifiableQuotes} quote(s) with unverifiable attribution`,
         );
         suggestions.push(
            "Name specific experts when quoting - generic attributions reduce trust",
         );
         score -= unverifiableQuotes * 8;
      }

      if (uncitedClaims > 0) {
         issues.push(`${uncitedClaims} claim(s) that need citations`);
         suggestions.push(
            "Replace generic claims like 'studies show' with specific references",
         );
         score -= uncitedClaims * 8;
      }

      // Add specific suggestions for uncited stats
      for (const stat of statistics.filter((s) => !s.hasCitation).slice(0, 3)) {
         suggestions.push(
            `"${stat.text}" - try searching: ${stat.suggestedSearchQuery}`,
         );
      }

      // Add concerns about quotes
      for (const quote of quotes.filter((q) => q.concern).slice(0, 2)) {
         suggestions.push(`Quote: ${quote.concern}`);
      }

      return {
         statistics,
         quotes,
         claims,
         score: Math.max(0, score),
         uncitedCount,
         issues,
         suggestions,
      };
   },
});
