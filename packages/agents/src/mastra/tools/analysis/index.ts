import { badPatternTool, getBadPatternInstructions } from "./bad-pattern-tool";
import { citationTool, getCitationInstructions } from "./citation-tool";
import {
   contentStructureTool,
   getContentStructureInstructions,
} from "./content-structure-tool";
import {
   duplicateContentTool,
   getDuplicateContentInstructions,
} from "./duplicate-content-tool";
import { getImageSeoInstructions, imageSeoTool } from "./image-seo-tool";
import {
   getKeywordDensityInstructions,
   keywordDensityTool,
} from "./keyword-density-tool";
import {
   getLinkDensityInstructions,
   linkDensityTool,
} from "./link-density-tool";
import {
   getOriginalityInstructions,
   originalityTool,
} from "./originality-tool";
import {
   getQuickAnswerAnalysisInstructions,
   quickAnswerAnalysisTool,
} from "./quick-answer-tool";
import {
   getReadabilityInstructions,
   readabilityTool,
} from "./readability-tool";
import { getSeoScoreInstructions, seoScoreTool } from "./seo-score-tool";
import { getTitleMetaInstructions, titleMetaTool } from "./title-meta-tool";
import {
   getToneAnalysisInstructions,
   toneAnalysisTool,
} from "./tone-analysis-tool";

// Re-export existing tools
export {
   badPatternTool,
   getBadPatternInstructions,
} from "./bad-pattern-tool";
export {
   citationTool,
   getCitationInstructions,
} from "./citation-tool";
export {
   contentStructureTool,
   getContentStructureInstructions,
} from "./content-structure-tool";
// Re-export new content quality tools
export {
   duplicateContentTool,
   getDuplicateContentInstructions,
} from "./duplicate-content-tool";
export {
   getImageSeoInstructions,
   imageSeoTool,
} from "./image-seo-tool";
export {
   getKeywordDensityInstructions,
   keywordDensityTool,
} from "./keyword-density-tool";
export {
   getLinkDensityInstructions,
   linkDensityTool,
} from "./link-density-tool";
export {
   getOriginalityInstructions,
   originalityTool,
} from "./originality-tool";
export {
   getQuickAnswerAnalysisInstructions,
   quickAnswerAnalysisTool,
} from "./quick-answer-tool";
export {
   getReadabilityInstructions,
   readabilityTool,
} from "./readability-tool";
export { getSeoScoreInstructions, seoScoreTool } from "./seo-score-tool";
// Re-export new SEO analysis tools
export {
   getTitleMetaInstructions,
   titleMetaTool,
} from "./title-meta-tool";
export {
   getToneAnalysisInstructions,
   toneAnalysisTool,
} from "./tone-analysis-tool";

// Combined instructions for all analysis tools
export function getAllAnalysisToolInstructions(): string {
   return `
# ANALYSIS TOOLS
These tools analyze the blog post for quality, SEO, and readability.

## EXISTING TOOLS
${getSeoScoreInstructions()}
${getReadabilityInstructions()}
${getKeywordDensityInstructions()}
${getContentStructureInstructions()}
${getBadPatternInstructions()}

## SEO ANALYSIS TOOLS
${getTitleMetaInstructions()}
${getQuickAnswerAnalysisInstructions()}
${getImageSeoInstructions()}
${getLinkDensityInstructions()}

## CONTENT QUALITY TOOLS
${getDuplicateContentInstructions()}
${getToneAnalysisInstructions()}
${getCitationInstructions()}
${getOriginalityInstructions()}
`;
}

// All analysis tools as an object for agent registration
export const analysisTools = {
   // Existing tools
   seoScore: seoScoreTool,
   readability: readabilityTool,
   keywordDensity: keywordDensityTool,
   contentStructure: contentStructureTool,
   badPatterns: badPatternTool,
   // New SEO analysis tools
   titleMeta: titleMetaTool,
   quickAnswerAnalysis: quickAnswerAnalysisTool,
   imageSeo: imageSeoTool,
   linkDensity: linkDensityTool,
   // New content quality tools
   duplicateContent: duplicateContentTool,
   toneAnalysis: toneAnalysisTool,
   citation: citationTool,
   originality: originalityTool,
};
