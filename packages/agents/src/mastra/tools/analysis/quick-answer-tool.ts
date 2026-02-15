import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const QuickAnswerInputSchema = z.object({
   content: z.string().describe("Full markdown content"),
   primaryKeyword: z.string().describe("Primary keyword"),
   contentType: z
      .enum(["how-to", "listicle", "comparison", "explainer", "general"])
      .default("general")
      .describe("Type of content"),
});

const QuickAnswerOutputSchema = z.object({
   hasQuickAnswer: z.boolean(),
   quickAnswerType: z.enum(["tldr", "definition", "table", "list", "none"]),
   first100Words: z.string(),
   score: z.number().min(0).max(100),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
   detectedPatterns: z.array(z.string()),
});

// Patterns for detecting quick answers
const TLDR_PATTERNS = [
   /^>\s*\*?\*?(?:tl;?dr|resumo\s*r[aá]pido|em\s*resumo|resumindo)\*?\*?/im,
   /\*\*(?:tl;?dr|resumo\s*r[aá]pido)\*\*/i,
   /^(?:tl;?dr|resumo):/im,
];

const DEFINITION_PATTERNS = [
   /^(?:[A-Z][^.!?]*)\s+(?:[eé]|is|are|significa|significa que)\s+/m,
   /\*\*[^*]+\*\*\s+(?:[eé]|is)\s+/,
   /^>\s*\*\*[^*]+\*\*\s*[:\-–]/m,
];

const TABLE_PATTERNS = [/^\|[^|]+\|[^|]+\|/m, /^\|[\s\-:]+\|[\s\-:]+\|/m];

const LIST_PATTERNS = [
   /^(?:\d+\.|[-*])\s+.+$/m,
   /^(?:primeiro|segundo|terceiro|first|second|third)/im,
];

// Content-type specific patterns
const CONTENT_TYPE_PATTERNS = {
   "how-to": {
      required: [/^\d+\.\s+/m, /^(?:passo|step)\s+\d+/im],
      name: "numbered steps",
   },
   listicle: {
      required: [/^(?:\d+\.|[-*])\s+\*?\*?[A-Z]/m],
      name: "list items with headers",
   },
   comparison: {
      required: [/^\|[^|]+\|[^|]+\|/m],
      name: "comparison table",
   },
   explainer: {
      required: [/(?:[eé]|is)\s+(?:um|uma|a|an|the)\s+/i, /significa\s+/i],
      name: "definition lead",
   },
   general: {
      required: [],
      name: "none",
   },
};

function getFirst100Words(content: string): string {
   // Remove markdown headers for word counting
   const cleanContent = content
      .replace(/^#+\s+.+$/gm, "") // Remove headers
      .replace(/^\s*>\s*/gm, "") // Remove blockquote markers
      .replace(/\*\*/g, "") // Remove bold
      .replace(/\*/g, "") // Remove italic
      .trim();

   const words = cleanContent.split(/\s+/).filter(Boolean);
   return words.slice(0, 100).join(" ");
}

function detectQuickAnswerType(
   content: string,
): z.infer<typeof QuickAnswerOutputSchema>["quickAnswerType"] {
   const first500Chars = content.slice(0, 500);

   // Check for TL;DR
   if (TLDR_PATTERNS.some((p) => p.test(first500Chars))) {
      return "tldr";
   }

   // Check for table (comparison)
   if (TABLE_PATTERNS.some((p) => p.test(first500Chars))) {
      return "table";
   }

   // Check for definition
   if (DEFINITION_PATTERNS.some((p) => p.test(first500Chars))) {
      return "definition";
   }

   // Check for list
   if (LIST_PATTERNS.some((p) => p.test(first500Chars))) {
      return "list";
   }

   return "none";
}

function detectPatterns(content: string): string[] {
   const patterns: string[] = [];
   const first1000Chars = content.slice(0, 1000);

   if (TLDR_PATTERNS.some((p) => p.test(first1000Chars))) {
      patterns.push("TL;DR or quick summary found");
   }

   if (DEFINITION_PATTERNS.some((p) => p.test(first1000Chars))) {
      patterns.push("Definition lead detected");
   }

   if (TABLE_PATTERNS.some((p) => p.test(first1000Chars))) {
      patterns.push("Comparison/data table found");
   }

   if (LIST_PATTERNS.some((p) => p.test(first1000Chars))) {
      patterns.push("Numbered or bulleted list found");
   }

   // Check for blockquote summary
   if (/^>\s*\*?\*?.+/m.test(first1000Chars)) {
      patterns.push("Blockquote summary detected");
   }

   // Check if primary question is answered
   if (/(?:[eé]|is|are|significa|são)\s+/i.test(first1000Chars)) {
      patterns.push("Direct answer pattern detected");
   }

   return patterns;
}

function hasContentTypeRequirements(
   content: string,
   contentType: keyof typeof CONTENT_TYPE_PATTERNS,
): { met: boolean; name: string } {
   const typeConfig = CONTENT_TYPE_PATTERNS[contentType];
   const first2000Chars = content.slice(0, 2000);

   if (typeConfig.required.length === 0) {
      return { met: true, name: typeConfig.name };
   }

   const met = typeConfig.required.some((pattern) =>
      pattern.test(first2000Chars),
   );
   return { met, name: typeConfig.name };
}

export const quickAnswerAnalysisTool = createTool({
   id: "quickAnswerAnalysis",
   description:
      "Analyze if content has a quick answer in the first 100 words. Checks for TL;DR, definitions, tables, and lists.",
   inputSchema: QuickAnswerInputSchema,
   outputSchema: QuickAnswerOutputSchema,
   execute: async (input) => {
      const { content, primaryKeyword, contentType } = input;

      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      const first100Words = getFirst100Words(content);
      const quickAnswerType = detectQuickAnswerType(content);
      const detectedPatterns = detectPatterns(content);
      const hasQuickAnswer = quickAnswerType !== "none";

      // Check if keyword is in first 100 words
      const keywordInFirst100 = first100Words
         .toLowerCase()
         .includes(primaryKeyword.toLowerCase());

      if (!keywordInFirst100) {
         issues.push("Primary keyword not found in first 100 words");
         suggestions.push(
            `Include "${primaryKeyword}" naturally in your opening paragraph`,
         );
         score -= 15;
      }

      // Check for quick answer
      if (!hasQuickAnswer) {
         issues.push("No quick answer detected in first 100 words");
         suggestions.push(
            "Add a TL;DR, definition lead, or comparison table early to answer the reader's question immediately",
         );
         score -= 25;
      }

      // Content-type specific checks
      const typeRequirements = hasContentTypeRequirements(content, contentType);
      if (!typeRequirements.met && contentType !== "general") {
         issues.push(
            `Content type "${contentType}" should have ${typeRequirements.name}`,
         );
         suggestions.push(`Add ${typeRequirements.name} to match content type`);
         score -= 20;
      }

      // Check if the opening answers a question
      const answersQuestion =
         /(?:^|\n)(?:>|\*\*)?[^.!?]*(?:[eé]|is|are|significa|são)\s+/i.test(
            content.slice(0, 500),
         );
      if (!answersQuestion && !hasQuickAnswer) {
         suggestions.push(
            "Start with a direct answer to the implied question from the title",
         );
         score -= 10;
      }

      // Bonus for good patterns
      if (detectedPatterns.length >= 2) {
         score = Math.min(100, score + 5); // Small bonus for multiple patterns
      }

      return {
         hasQuickAnswer,
         quickAnswerType,
         first100Words,
         score: Math.max(0, score),
         issues,
         suggestions,
         detectedPatterns,
      };
   },
});
