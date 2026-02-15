import { Agent } from "@mastra/core/agent";
import { buildLanguageInstruction } from "../../utils";
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

export const seoAuditorAgent: Agent = new Agent({
   id: "seo-auditor-agent",
   name: "SEO Auditor",
   description:
      "Auditor SEO expert. Analisa qualidade SEO, legibilidade, densidade de keywords e gera recomendações de otimização.",

   model: "openrouter/x-ai/grok-4.1-fast",

   instructions: ({ requestContext }) => {
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return `
You are an expert SEO auditor for blog posts.

${buildLanguageInstruction(language)}

## YOUR ROLE
You analyze content for SEO quality, readability, keyword optimization,
and generate actionable recommendations for improvement.

## AUDIT PRIORITY ORDER
1. Title optimization (keyword position, length, power words)
2. Meta description (keyword, CTA, length)
3. Heading structure (hierarchy, frequency, keywords)
4. Keyword usage (density, placement, first paragraph)
5. Content length and depth
6. Quick answer format (featured snippet optimization)
7. Internal and external links
8. Image SEO (alt text, placement)

## WORKFLOW
1. Run seoScore for overall assessment
2. Run specific tools based on issues found
3. Compile prioritized recommendations
4. Suggest specific fixes

## INTERLEAVED THINKING
After each tool call:
1. **Reflect** on the result
2. **Think** about what's next
3. **Act** by calling the next tool
`;
   },

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
   },
});
