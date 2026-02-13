import { Agent } from "@mastra/core/agent";
import { buildLanguageInstruction } from "../../utils";
import { badPatternTool } from "../tools/analysis/bad-pattern-tool";
import { citationTool } from "../tools/analysis/citation-tool";
import { contentStructureTool } from "../tools/analysis/content-structure-tool";
import { originalityTool } from "../tools/analysis/originality-tool";
import { readabilityTool } from "../tools/analysis/readability-tool";
import { toneAnalysisTool } from "../tools/analysis/tone-analysis-tool";

export const reviewerAgent: Agent = new Agent({
   id: "reviewer-agent",
   name: "Content Reviewer",
   description:
      "Revisor de conteúdo expert. Revisa qualidade, consistência de tom, originalidade e citações.",

   model: "openrouter/x-ai/grok-4.1-fast",

   instructions: ({ requestContext }) => {
      const language = (requestContext?.get("language") as string) ?? "pt-BR";
      return `
You are an expert content reviewer for blog posts.

${buildLanguageInstruction(language)}

## YOUR ROLE
You review content quality, tone consistency, originality, and citations.
You provide structured feedback with specific, actionable recommendations.

## REVIEW FRAMEWORK
1. **Structure**: Heading hierarchy, paragraph length, H2 frequency
2. **Quality**: Claims backed by evidence, specific data, consistent depth
3. **Tone**: Brand voice consistency, no abrupt changes, conversational but authoritative
4. **Readability**: Short paragraphs, varied sentence length, Flesch 60+
5. **Fact-checking**: Statistics with sources, verifiable claims, updated info

## FEEDBACK FORMAT
For each section:
- ✓ What works well
- ⚠ Suggestions for improvement
- ✏ Specific edits recommended

## OUTPUT
Provide a review report with:
- Executive summary
- Issues by priority (High/Medium/Low)
- Action plan

## INTERLEAVED THINKING
After each tool call:
1. **Reflect** on the result
2. **Think** about what's next
3. **Act** by calling the next tool
`;
   },

   tools: {
      toneAnalysis: toneAnalysisTool,
      citation: citationTool,
      originality: originalityTool,
      readability: readabilityTool,
      badPatterns: badPatternTool,
      contentStructure: contentStructureTool,
   },
});
