import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const StructureIssueSchema = z.object({
   type: z.string(),
   severity: z.enum(["error", "warning", "info"]),
   message: z.string(),
   suggestion: z.string(),
});

export const contentStructureTool = createTool({
   id: "content-structure",
   description:
      "Validates blog post structure against best practices including heading hierarchy, paragraph length, and content organization.",
   inputSchema: z.object({
      content: z.string().describe("The blog post content to analyze"),
      contentType: z
         .enum(["how-to", "comparison", "explainer", "listicle", "general"])
         .optional()
         .describe("The type of content for specific structure validation"),
   }),
   outputSchema: z.object({
      score: z.number().min(0).max(100),
      issues: z.array(StructureIssueSchema),
      structure: z.object({
         hasQuickAnswer: z.boolean(),
         headingHierarchyValid: z.boolean(),
         avgParagraphLength: z.number(),
         hasTableOfContents: z.boolean(),
         hasTables: z.boolean(),
         hasConclusion: z.boolean(),
         headingCount: z.number(),
         wordCount: z.number(),
      }),
   }),
   execute: async (inputData) => {
      const { content, contentType } = inputData;

      const issues: z.infer<typeof StructureIssueSchema>[] = [];
      let score = 100;

      // Basic content analysis
      const words = content.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      const paragraphs = content.split(/\n\n+/).filter(Boolean);

      // Extract headings with their levels
      const headingMatches = content.matchAll(/^(#{1,6})\s+(.+)$/gm);
      const headings: { level: number; text: string; index: number }[] = [];
      for (const match of headingMatches) {
         const hashMarks = match[1];
         const headingText = match[2];
         if (hashMarks && headingText) {
            headings.push({
               level: hashMarks.length,
               text: headingText,
               index: match.index ?? 0,
            });
         }
      }

      // Check for H1 in content (should not be there - title is in frontmatter)
      const hasH1InContent = headings.some((h) => h.level === 1);
      if (hasH1InContent) {
         issues.push({
            type: "heading_h1",
            severity: "error",
            message: "H1 heading found in content body",
            suggestion:
               "Remove H1 (# heading) from content. The title is in frontmatter. Start content with H2 (##).",
         });
         score -= 15;
      }

      // Check heading hierarchy (no skipping levels)
      let headingHierarchyValid = true;
      for (let i = 1; i < headings.length; i++) {
         const prevHeading = headings[i - 1];
         const currentHeading = headings[i];
         if (!prevHeading || !currentHeading) continue;
         const prevLevel = prevHeading.level;
         const currentLevel = currentHeading.level;
         // Can go up any amount, but can only go down by 1
         if (currentLevel > prevLevel + 1) {
            headingHierarchyValid = false;
            issues.push({
               type: "heading_hierarchy",
               severity: "warning",
               message: `Heading level skipped: H${prevLevel} to H${currentLevel} ("${currentHeading.text}")`,
               suggestion: `Don't skip heading levels. Use H${prevLevel + 1} instead of H${currentLevel}.`,
            });
            score -= 5;
         }
      }

      // Check for quick answer in first 100 words
      const first100Words = words.slice(0, 100).join(" ");
      const hasQuickAnswer =
         // Check for TL;DR or summary patterns
         /\*\*quick\s*answer\*\*|>.*quick.*answer|tl;?dr|em\s+resumo|resumindo/i.test(
            first100Words,
         ) ||
         // Check for immediate definition patterns
         /^.*?\*\*[^*]+\*\*\s+(?:é|is|are|was|were|significa)\s/im.test(
            first100Words,
         ) ||
         // Check for comparison table early
         /^\|.*\|.*\|$/m.test(first100Words);

      if (!hasQuickAnswer && wordCount > 300) {
         issues.push({
            type: "quick_answer",
            severity: "warning",
            message: "No quick answer detected in first 100 words",
            suggestion:
               "Add a TL;DR box, definition lead, or comparison table early to answer the reader's question immediately.",
         });
         score -= 10;
      }

      // Check paragraph lengths
      let totalSentences = 0;
      let longParagraphs = 0;
      for (const paragraph of paragraphs) {
         // Skip headings and code blocks
         if (paragraph.startsWith("#") || paragraph.startsWith("```")) continue;

         const sentences = paragraph.split(/[.!?]+/).filter(Boolean);
         totalSentences += sentences.length;

         if (sentences.length > 4) {
            longParagraphs++;
         }
      }

      const avgParagraphLength =
         paragraphs.length > 0 ? totalSentences / paragraphs.length : 0;

      if (longParagraphs > 0) {
         issues.push({
            type: "paragraph_length",
            severity: "info",
            message: `${longParagraphs} paragraph(s) exceed 4 sentences`,
            suggestion:
               "Break up long paragraphs. Aim for 2-4 sentences per paragraph for better readability.",
         });
         score -= Math.min(longParagraphs * 2, 10);
      }

      // Check H2 frequency (every 200-300 words)
      const h2Headings = headings.filter((h) => h.level === 2);
      const expectedH2Count = Math.floor(wordCount / 250);
      if (h2Headings.length < expectedH2Count && wordCount > 500) {
         issues.push({
            type: "heading_frequency",
            severity: "warning",
            message: `Only ${h2Headings.length} H2 headings for ${wordCount} words (recommended: ${expectedH2Count})`,
            suggestion:
               "Add more H2 headings to break up content. Aim for one H2 every 200-300 words.",
         });
         score -= 5;
      }

      // Check for table of contents (if > 1500 words)
      const hasTableOfContents =
         /##\s*(?:table of contents|sumário|índice|contents)/i.test(content) ||
         /\[.*\]\(#.*\)/.test(content.slice(0, 500)); // Check for anchor links early

      if (wordCount > 1500 && !hasTableOfContents) {
         issues.push({
            type: "table_of_contents",
            severity: "info",
            message: "No table of contents detected for long-form content",
            suggestion:
               "Add a table of contents near the beginning for posts over 1500 words.",
         });
         score -= 3;
      }

      // Check for tables
      const hasTables = /^\|.*\|.*\|$/m.test(content);

      // Check for conclusion
      const hasConclusion =
         /##\s*(?:conclus|conclusion|resumo|takeaway|key\s*takeaway|final|wrapping\s*up)/i.test(
            content,
         );

      if (!hasConclusion && wordCount > 500) {
         issues.push({
            type: "conclusion",
            severity: "info",
            message: "No conclusion section detected",
            suggestion:
               "Add a conclusion with key takeaways and a call-to-action.",
         });
         score -= 5;
      }

      // Content type specific checks
      if (contentType === "how-to") {
         // Check for numbered steps
         const hasNumberedSteps =
            /^\d+\.\s+/m.test(content) ||
            /step\s*\d+|passo\s*\d+/i.test(content);
         if (!hasNumberedSteps) {
            issues.push({
               type: "how_to_structure",
               severity: "warning",
               message: "How-to content should have numbered steps",
               suggestion:
                  "Use numbered lists (1. 2. 3.) for step-by-step instructions.",
            });
            score -= 5;
         }
      }

      if (contentType === "comparison") {
         // Check for comparison table
         if (!hasTables) {
            issues.push({
               type: "comparison_structure",
               severity: "warning",
               message: "Comparison content should include a comparison table",
               suggestion:
                  "Add a table comparing key metrics between the options.",
            });
            score -= 5;
         }
      }

      if (contentType === "listicle") {
         // Check for list items
         const listItemCount = (content.match(/^[-*]\s+/gm) || []).length;
         if (listItemCount < 3) {
            issues.push({
               type: "listicle_structure",
               severity: "warning",
               message: "Listicle should have multiple list items",
               suggestion:
                  "Add more items to your list for a comprehensive listicle.",
            });
            score -= 5;
         }
      }

      return {
         score: Math.max(0, Math.min(100, score)),
         issues,
         structure: {
            hasQuickAnswer,
            headingHierarchyValid,
            avgParagraphLength: Math.round(avgParagraphLength * 10) / 10,
            hasTableOfContents,
            hasTables,
            hasConclusion,
            headingCount: headings.length,
            wordCount,
         },
      };
   },
});
