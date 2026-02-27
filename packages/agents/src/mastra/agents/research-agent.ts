import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { dateTool } from "../tools/date-tool";
import { editDescriptionTool } from "../tools/frontmatter/edit-description-tool";
import { editKeywordsTool } from "../tools/frontmatter/edit-keywords-tool";
import { editSlugTool } from "../tools/frontmatter/edit-slug-tool";
import { editTitleTool } from "../tools/frontmatter/edit-title-tool";
import { getInstructionsTool } from "../tools/memory/get-instructions-tool";
import { graphSearchTool } from "../tools/rag/graph-search-tool";
import { searchPreviousContentTool } from "../tools/rag/search-previous-content-tool";
import { competitorContentTool } from "../tools/research/competitor-content-tool";
import { contentGapTool } from "../tools/research/content-gap-tool";
import { factFinderTool } from "../tools/research/fact-finder-tool";
import { relatedKeywordsTool } from "../tools/research/related-keywords-tool";
import { researchCompletenessTool } from "../tools/research/research-completeness-tool";
import { serpAnalysisTool } from "../tools/research/serp-analysis-tool";
import { webCrawlTool } from "../tools/research/web-crawl-tool";
import { webSearchTool } from "../tools/research/web-search-tool";

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

# RESEARCH & PLANNING AGENT

You are an expert content researcher and strategist.
Your job: gather intelligence, plan content structure, and deliver rich research briefings.

## YOUR TOOLS

**Research:**
- webSearch — broad topic research
- serpAnalysis — SERP landscape for a keyword
- competitorContent — what top competitors cover
- contentGap — gaps competitors miss
- relatedKeywords — keyword clusters
- factFinder — specific statistics and data points
- webCrawl — deep-dive crawl of a specific URL
- researchCompleteness — validate you've been thorough

**Memory & RAG:**
- getInstructionMemories — load writer preferences
- searchPreviousContent — avoid duplicating published content
- graphSearch — semantic knowledge graph lookup

**Planning (Frontmatter):**
- editTitle, editDescription, editKeywords, editSlug — set content metadata

## PLANNING WORKFLOW

When asked to plan content:
1. searchPreviousContent — check existing coverage
2. webSearch + serpAnalysis — understand the landscape
3. contentGap — find angles competitors miss
4. relatedKeywords — build keyword clusters
5. Set frontmatter: editTitle, editDescription, editKeywords, editSlug
6. Deliver a structured outline (H2/H3 hierarchy)

## RESEARCH WORKFLOW

When asked to research a topic:
1. serpAnalysis — top-10 SERP analysis
2. competitorContent — what's working for top competitors
3. contentGap — what they miss
4. factFinder + webSearch — supporting data
5. researchCompleteness — validate thoroughness
6. Deliver a research briefing with sources

## OUTPUT FORMAT

Always produce a structured briefing:
- Executive summary (2-3 sentences)
- Key findings (bullet points with sources)
- Keyword strategy
- Recommended content structure
- Gaps and opportunities

Respond in the same language as the user request.
`;
};

export const researchAgent: Agent = new Agent({
   id: "research-agent",
   name: "Research & Planning Agent",
   description:
      "Specialized in content research, SERP analysis, competitor analysis, keyword research, content gaps, and content planning. Use this agent for: researching topics, planning content structure, analyzing competitors, finding keyword opportunities, and building research briefings.",

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
      getInstructionMemories: getInstructionsTool,
      searchPreviousContent: searchPreviousContentTool,
      graphSearch: graphSearchTool,
      webSearch: webSearchTool,
      serpAnalysis: serpAnalysisTool,
      contentGap: contentGapTool,
      competitorContent: competitorContentTool,
      relatedKeywords: relatedKeywordsTool,
      factFinder: factFinderTool,
      webCrawl: webCrawlTool,
      researchCompleteness: researchCompletenessTool,
      editTitle: editTitleTool,
      editDescription: editDescriptionTool,
      editKeywords: editKeywordsTool,
      editSlug: editSlugTool,
      dateTool: dateTool,
   },
});
