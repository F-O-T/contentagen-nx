/**
 * Content Analysis Library
 *
 * A comprehensive library for analyzing content quality, SEO optimization,
 * readability, structure, and detecting problematic patterns.
 *
 * @packageDocumentation
 */

export { analyzeBadPatterns } from "./bad-patterns.ts";
export { analyzeKeywords } from "./keywords.ts";
export { analyzeReadability } from "./readability.ts";
// Individual analyzers
export { analyzeSeo } from "./seo.ts";
export { analyzeStructure } from "./structure.ts";

// Types
export * from "./types.ts";

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
} from "./utils.ts";

import { analyzeBadPatterns } from "./bad-patterns.ts";
import { analyzeKeywords } from "./keywords.ts";
import { analyzeReadability } from "./readability.ts";
import { analyzeSeo } from "./seo.ts";
import { analyzeStructure } from "./structure.ts";
// Import for combined analysis
import type { AnalysisInput, ContentAnalysisResult } from "./types.ts";

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
