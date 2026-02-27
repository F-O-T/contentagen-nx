import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { badPatternTool } from "../tools/analysis/bad-pattern-tool";
import { citationTool } from "../tools/analysis/citation-tool";
import { contentStructureTool } from "../tools/analysis/content-structure-tool";
import { duplicateContentTool } from "../tools/analysis/duplicate-content-tool";
import { imageSeoTool } from "../tools/analysis/image-seo-tool";
import { keywordDensityTool } from "../tools/analysis/keyword-density-tool";
import { linkDensityTool } from "../tools/analysis/link-density-tool";
import { originalityTool } from "../tools/analysis/originality-tool";
import { quickAnswerAnalysisTool } from "../tools/analysis/quick-answer-tool";
import { readabilityTool } from "../tools/analysis/readability-tool";
import { seoScoreTool } from "../tools/analysis/seo-score-tool";
import { titleMetaTool } from "../tools/analysis/title-meta-tool";
import { toneAnalysisTool } from "../tools/analysis/tone-analysis-tool";
import { dateTool } from "../tools/date-tool";
import { addExternalLinksTool } from "../tools/editor/add-external-links-tool";
import { addInternalLinksTool } from "../tools/editor/add-internal-links-tool";
import { generateQuickAnswerTool } from "../tools/editor/generate-quick-answer-tool";
import { improveReadabilityTool } from "../tools/editor/improve-readability-tool";
import { injectKeywordsTool } from "../tools/editor/inject-keywords-tool";
import { optimizeMetaTool } from "../tools/editor/optimize-meta-tool";
import { optimizeTitleTool } from "../tools/editor/optimize-title-tool";
import { suggestImagesTool } from "../tools/editor/suggest-images-tool";
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";

const memory = new Memory({
   options: {
      lastMessages: 20,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getInstructions = (
   language: string,
   writerInstructions?: InstructionMemoryItem[],
): string => {
   const compiledMemories = compileInstructionMemories(
      writerInstructions ?? [],
   );
   const languageInstruction = buildLanguageInstruction(language);

   return `
${languageInstruction}

${compiledMemories}

# SEO AUDITOR AGENT

You are an expert SEO analyst and optimizer.
Your job: audit content SEO quality and apply concrete improvements.

## SEO AUDIT PRIORITY ORDER

1. seoScore — overall score baseline
2. titleMeta → optimizeTitle, optimizeMeta — title/description
3. contentStructure — heading hierarchy
4. keywordDensity → injectKeywords — keyword usage
5. readability → improveReadability — clarity
6. quickAnswerAnalysis → generateQuickAnswer — featured snippet opportunity
7. linkDensity → addInternalLinks, addExternalLinks — link profile
8. imageSeo → suggestImages — image optimization
9. badPatterns — AI-sounding content, fillers
10. duplicateContent — uniqueness check

## ALWAYS FOLLOW THIS PATTERN

1. Run seoScore first for overall picture
2. Run issue-specific tools based on low scores
3. Apply fixes using editor/frontmatter tools
4. Re-run seoScore to confirm improvements
5. Deliver a prioritized report (High/Medium/Low)

## REPORT FORMAT

\`\`\`
# SEO Audit Report

## Overall Score: X/100

## High Priority Issues
- [Issue]: [Fix applied or recommendation]

## Medium Priority Issues
- [Issue]: [Fix applied or recommendation]

## Low Priority Issues
- [Issue]: [Fix applied or recommendation]

## Summary of Changes Applied
- [Change 1]
- [Change 2]
\`\`\`

Respond in the same language as the user request.
`;
};

export const seoAuditorAgent: Agent = new Agent({
   id: "seo-auditor-agent",
   name: "SEO Auditor Agent",
   description:
      "Specialized in SEO analysis, scoring, keyword density, readability, title/meta optimization, link density, image SEO, duplicate content detection, and applying SEO improvements. Use this agent for: SEO audits, SEO scores, keyword optimization, meta description optimization, readability improvements.",

   model: ({ requestContext }) => {
      const maybeModel = requestContext?.get("model");
      return typeof maybeModel === "string" && maybeModel.length > 0
         ? maybeModel
         : DEFAULT_CONTENT_MODEL_ID;
   },

   instructions: ({ requestContext }) => {
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return getInstructions(language, writerInstructions);
   },

   memory,

   tools: {
      seoScore: seoScoreTool,
      readability: readabilityTool,
      keywordDensity: keywordDensityTool,
      contentStructure: contentStructureTool,
      badPatterns: badPatternTool,
      titleMeta: titleMetaTool,
      quickAnswerAnalysis: quickAnswerAnalysisTool,
      imageSeo: imageSeoTool,
      linkDensity: linkDensityTool,
      duplicateContent: duplicateContentTool,
      toneAnalysis: toneAnalysisTool,
      citation: citationTool,
      originality: originalityTool,
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,
      optimizeTitle: optimizeTitleTool,
      optimizeMeta: optimizeMetaTool,
      injectKeywords: injectKeywordsTool,
      addInternalLinks: addInternalLinksTool,
      addExternalLinks: addExternalLinksTool,
      improveReadability: improveReadabilityTool,
      generateQuickAnswer: generateQuickAnswerTool,
      suggestImages: suggestImagesTool,
      dateTool: dateTool,
   },
});
