/**
 * Content Analysis Library
 *
 * A comprehensive library for analyzing content quality, SEO optimization,
 * readability, structure, and detecting problematic patterns.
 *
 * @packageDocumentation
 */

export { analyzeBadPatterns } from "./bad-patterns";
export { analyzeKeywords } from "./keywords";
export { analyzeReadability } from "./readability";
// Individual analyzers
export { analyzeSeo } from "./seo";
export { analyzeStructure } from "./structure";

// Types
export * from "./types";

// Utilities (exported for advanced usage)
export {
   calculateFleschKincaid,
   clampScore,
   countSyllables,
   extractHeadings,
   extractParagraphs,
   extractWords,
   findOccurrences,
   getReadabilityLevel,
   hasConclusionSection,
   hasQuickAnswerPattern,
} from "./utils";

import { analyzeBadPatterns } from "./bad-patterns";
import { analyzeKeywords } from "./keywords";
import { analyzeReadability } from "./readability";
import { analyzeSeo } from "./seo";
import { analyzeStructure } from "./structure";
// Import for combined analysis
import type { AnalysisInput, ContentAnalysisResult } from "./types";

/**
 * Perform a comprehensive content analysis
 *
 * This function runs all available analyzers and returns a combined result:
 * - SEO analysis (title, meta, keywords, structure)
 * - Readability analysis (Flesch-Kincaid scores)
 * - Structure analysis (headings, paragraphs, quick answers)
 * - Bad pattern detection (filler phrases, clickbait, etc.)
 * - Keyword analysis (density, placement, recommendations)
 *
 * @param input - The content and metadata to analyze
 * @returns Combined analysis results from all analyzers
 *
 * @example
 * ```typescript
 * import { analyzeContent } from '@f-o-t/content-analysis';
 *
 * const result = analyzeContent({
 *   content: '## Introduction\n\nThis is my blog post...',
 *   title: 'My Blog Post Title',
 *   description: 'A short description for SEO',
 *   targetKeywords: ['blog', 'tutorial'],
 * });
 *
 * console.log(result.seo.score); // 85
 * console.log(result.readability.fleschKincaidReadingEase); // 65.2
 * ```
 */
export function analyzeContent(input: AnalysisInput): ContentAnalysisResult {
   const { content, title, description, targetKeywords } = input;

   const seo = analyzeSeo({
      content,
      title,
      metaDescription: description,
      targetKeywords,
   });

   const readability = analyzeReadability(content, "general");
   const structure = analyzeStructure(content);
   const badPatterns = analyzeBadPatterns(content, title);

   const keywords =
      targetKeywords && targetKeywords.length > 0
         ? analyzeKeywords({ content, title, targetKeywords })
         : null;

   return {
      seo,
      readability,
      structure,
      badPatterns,
      keywords,
      analyzedAt: new Date().toISOString(),
   };
}
