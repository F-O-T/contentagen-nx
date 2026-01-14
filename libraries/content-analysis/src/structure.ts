/**
 * Content Structure Analysis Module
 * Analyzes content structure for SEO and readability best practices
 */

import type {
   ContentStructure,
   ContentType,
   StructureIssue,
   StructureResult,
} from "./types";
import {
   clampScore,
   extractHeadings,
   extractParagraphs,
   extractWords,
   hasConclusionSection,
   hasQuickAnswerPattern,
} from "./utils";

/**
 * Analyze content structure
 */
export function analyzeStructure(
   content: string,
   contentType?: ContentType,
): StructureResult {
   const issues: StructureIssue[] = [];
   let score = 100;

   const words = extractWords(content);
   const wordCount = words.length;
   const paragraphs = extractParagraphs(content);
   const headings = extractHeadings(content);

   // Check for H1 in content
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

   // Check heading hierarchy
   let headingHierarchyValid = true;
   for (let i = 1; i < headings.length; i++) {
      const prevHeading = headings[i - 1];
      const currentHeading = headings[i];
      if (!prevHeading || !currentHeading) continue;
      const prevLevel = prevHeading.level;
      const currentLevel = currentHeading.level;
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
   const hasQuickAnswer = hasQuickAnswerPattern(first100Words);

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

   // Check H2 frequency
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

   // Check for table of contents
   const hasTableOfContents =
      /##\s*(?:table of contents|sumário|índice|contents)/i.test(content) ||
      /\[.*\]\(#.*\)/.test(content.slice(0, 500));

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
   const hasConclusion = hasConclusionSection(content);

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
      const hasNumberedSteps =
         /^\d+\.\s+/m.test(content) || /step\s*\d+|passo\s*\d+/i.test(content);
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

   const structure: ContentStructure = {
      hasQuickAnswer,
      headingHierarchyValid,
      avgParagraphLength: Math.round(avgParagraphLength * 10) / 10,
      hasTableOfContents,
      hasTables,
      hasConclusion,
      headingCount: headings.length,
      wordCount,
   };

   return {
      score: clampScore(score),
      issues,
      structure,
   };
}
