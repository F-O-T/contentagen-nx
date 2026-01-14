/**
 * SEO Analysis Module
 * Analyzes content for search engine optimization factors
 */

import type { SeoInput, SeoIssue, SeoMetrics, SeoResult } from "./types";
import {
   clampScore,
   extractParagraphs,
   extractWords,
   hasConclusionSection,
   hasQuickAnswerPattern,
} from "./utils";

/**
 * Analyze content for SEO optimization
 */
export function analyzeSeo(input: SeoInput): SeoResult {
   const { content, title, metaDescription, targetKeywords } = input;
   const issues: SeoIssue[] = [];
   const recommendations: string[] = [];

   // Basic content analysis
   const words = extractWords(content);
   const wordCount = words.length;
   const paragraphs = extractParagraphs(content);
   const headings = content.match(/^#{1,6}\s.+$/gm) || [];
   const h2Headings = content.match(/^##\s.+$/gm) || [];
   const links = content.match(/\[.+?\]\(.+?\)/g) || [];
   const images = content.match(/!\[.+?\]\(.+?\)/g) || [];

   // Get first paragraph (before first heading or first 100 words)
   const firstH2Index = content.search(/^##\s/m);
   const firstParagraphText =
      firstH2Index > 0
         ? content.slice(0, firstH2Index)
         : words.slice(0, 100).join(" ");

   let score = 100;

   // Title checks (15 points max)
   if (!title) {
      issues.push({
         type: "title",
         severity: "error",
         message: "Missing title",
         suggestion: "Add a descriptive title (50-60 characters)",
      });
      score -= 15;
   } else if (title.length < 30) {
      issues.push({
         type: "title",
         severity: "warning",
         message: "Title is too short",
         suggestion: "Expand title to 50-60 characters for better SEO",
      });
      score -= 8;
   } else if (title.length > 60) {
      issues.push({
         type: "title",
         severity: "warning",
         message: "Title is too long",
         suggestion:
            "Shorten to under 60 characters to avoid truncation in search results",
      });
      score -= 5;
   }

   // Check for keyword in title
   if (title && targetKeywords && targetKeywords.length > 0) {
      const titleLower = title.toLowerCase();
      const hasKeywordInTitle = targetKeywords.some((kw) =>
         titleLower.includes(kw.toLowerCase()),
      );
      if (!hasKeywordInTitle) {
         issues.push({
            type: "title",
            severity: "warning",
            message: "Primary keyword not found in title",
            suggestion: "Include your primary keyword naturally in the title",
         });
         score -= 5;
      }
   }

   // Meta description checks (10 points max)
   if (!metaDescription) {
      issues.push({
         type: "meta_description",
         severity: "warning",
         message: "Missing meta description",
         suggestion: "Add a meta description (150-160 characters)",
      });
      score -= 10;
   } else if (metaDescription.length < 120) {
      issues.push({
         type: "meta_description",
         severity: "info",
         message: "Meta description could be longer",
         suggestion: "Expand to 150-160 characters",
      });
      score -= 3;
   } else if (metaDescription.length > 160) {
      issues.push({
         type: "meta_description",
         severity: "warning",
         message: "Meta description is too long",
         suggestion: "Shorten to under 160 characters",
      });
      score -= 5;
   }

   // Headings checks (15 points max)
   if (headings.length === 0) {
      issues.push({
         type: "headings",
         severity: "error",
         message: "No headings found",
         suggestion: "Add H2 and H3 headings to structure your content",
      });
      score -= 15;
   } else if (h2Headings.length < 3 && wordCount > 500) {
      issues.push({
         type: "headings",
         severity: "warning",
         message: "Too few H2 headings for content length",
         suggestion: "Add more H2 subheadings (one every 200-300 words)",
      });
      score -= 5;
   }

   // Check heading hierarchy - no H1 in content
   const h1Headings = content.match(/^#\s.+$/gm) || [];
   if (h1Headings.length > 0) {
      issues.push({
         type: "headings",
         severity: "error",
         message: "H1 heading found in content body",
         suggestion:
            "Remove H1 from content. The title is in frontmatter. Start with H2.",
      });
      score -= 10;
   }

   // Check for keywords in H2 headings
   if (targetKeywords && targetKeywords.length > 0 && h2Headings.length > 0) {
      const h2Text = h2Headings.join(" ").toLowerCase();
      const hasKeywordInH2 = targetKeywords.some((kw) =>
         h2Text.includes(kw.toLowerCase()),
      );
      if (!hasKeywordInH2) {
         issues.push({
            type: "heading_keywords",
            severity: "info",
            message: "Target keywords not found in any H2 headings",
            suggestion: "Include keywords naturally in at least one H2 heading",
         });
         score -= 3;
      }
   }

   // Content length checks (10 points max)
   if (wordCount < 300) {
      issues.push({
         type: "content_length",
         severity: "error",
         message: "Content is too short",
         suggestion: "Aim for at least 600-1000 words for blog posts",
      });
      score -= 10;
   } else if (wordCount < 600) {
      issues.push({
         type: "content_length",
         severity: "warning",
         message: "Content could be longer",
         suggestion: "Consider expanding to 1000+ words for better ranking",
      });
      score -= 5;
   }

   // Link checks (10 points max)
   if (links.length === 0 && wordCount > 500) {
      issues.push({
         type: "links",
         severity: "warning",
         message: "No links found",
         suggestion: "Add internal and external links to improve SEO",
      });
      score -= 10;
   } else if (links.length < 3 && wordCount > 1000) {
      issues.push({
         type: "links",
         severity: "info",
         message: "Few links for content length",
         suggestion:
            "Add more internal links to related content and external links to authoritative sources",
      });
      score -= 3;
   }

   // Image checks
   if (images.length === 0 && wordCount > 300) {
      issues.push({
         type: "images",
         severity: "info",
         message: "No images found",
         suggestion: "Add images with descriptive alt text",
      });
      score -= 3;
   }

   // Quick Answer check (10 points max)
   const hasQuickAnswer = hasQuickAnswerPattern(firstParagraphText);

   if (!hasQuickAnswer && wordCount > 300) {
      issues.push({
         type: "quick_answer",
         severity: "warning",
         message: "No quick answer detected in first 100 words",
         suggestion:
            "Add a TL;DR, definition lead, or comparison table early to answer the reader's question immediately",
      });
      score -= 10;
   }

   // First paragraph keyword check
   let keywordInFirstParagraph = false;
   if (targetKeywords && targetKeywords.length > 0) {
      const firstParaLower = firstParagraphText.toLowerCase();
      keywordInFirstParagraph = targetKeywords.some((kw) =>
         firstParaLower.includes(kw.toLowerCase()),
      );
      if (!keywordInFirstParagraph) {
         issues.push({
            type: "first_paragraph",
            severity: "warning",
            message: "Primary keyword not found in first paragraph",
            suggestion:
               "Include your primary keyword in the first 100 words for better SEO",
         });
         score -= 5;
      }
   }

   // Keyword density
   const keywordDensity: Record<string, number> = {};
   if (targetKeywords && targetKeywords.length > 0) {
      const contentLower = content.toLowerCase();
      for (const keyword of targetKeywords) {
         const regex = new RegExp(keyword.toLowerCase(), "gi");
         const matches = contentLower.match(regex) || [];
         keywordDensity[keyword] = Number(
            ((matches.length / wordCount) * 100).toFixed(2),
         );

         if (keywordDensity[keyword] === 0) {
            issues.push({
               type: "keyword_density",
               severity: "warning",
               message: `Target keyword "${keyword}" not found`,
               suggestion: `Include "${keyword}" naturally in your content`,
            });
            score -= 5;
         } else if (keywordDensity[keyword] > 3) {
            issues.push({
               type: "keyword_density",
               severity: "warning",
               message: `Keyword "${keyword}" may be overused (${keywordDensity[keyword]}%)`,
               suggestion: "Reduce keyword density to 1-2%",
            });
            score -= 3;
         }
      }
   }

   // Structure quality check
   const hasConclusion = hasConclusionSection(content);
   if (!hasConclusion && wordCount > 500) {
      issues.push({
         type: "structure",
         severity: "info",
         message: "No conclusion section detected",
         suggestion: "Add a conclusion with key takeaways and a call-to-action",
      });
      score -= 5;
   }

   // Generate recommendations
   if (issues.some((i) => i.type === "content_length")) {
      recommendations.push(
         "Expand your content with more detailed explanations and examples",
      );
   }
   if (issues.some((i) => i.type === "headings")) {
      recommendations.push(
         "Structure your content with clear H2 and H3 headings",
      );
   }
   if (issues.some((i) => i.type === "links")) {
      recommendations.push(
         "Add relevant internal links to other blog posts and external links to authoritative sources",
      );
   }
   if (issues.some((i) => i.type === "quick_answer")) {
      recommendations.push(
         "Start with a quick answer - readers want the answer immediately, not after scrolling",
      );
   }
   if (issues.some((i) => i.type === "first_paragraph")) {
      recommendations.push(
         "Include your primary keyword in the first paragraph for better search visibility",
      );
   }

   const metrics: SeoMetrics = {
      wordCount,
      headingCount: headings.length,
      paragraphCount: paragraphs.length,
      linkCount: links.length,
      imageCount: images.length,
      hasQuickAnswer,
      keywordInFirstParagraph,
      keywordDensity:
         Object.keys(keywordDensity).length > 0 ? keywordDensity : undefined,
   };

   return {
      score: clampScore(score),
      issues,
      recommendations,
      metrics,
   };
}
