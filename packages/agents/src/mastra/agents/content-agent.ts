// packages/agents/src/mastra/agents/content-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { researchAgent } from "./research-agent";
import { reviewerAgent } from "./reviewer-agent";
import { seoAuditorAgent } from "./seo-auditor-agent";
import { writerAgent } from "./writer-agent";

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getContentAgentInstructions = (
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

# CONTENT AGENT — DOMAIN ROUTER

You are the content domain orchestrator. You receive tasks from the platform router.
When you receive a prefix like "[Usar writer-agent]:", route directly to that agent without your own reasoning.

## YOUR SPECIALISTS

**research-agent** — Research & Planning Agent
Use when: researching topics, planning content, analyzing SERPs, finding competitors, keyword research, content gaps, building outlines

**writer-agent** — Writer & Editor Agent
Use when: writing articles, editing content, inserting elements, formatting, making inline edits, producing full content drafts

**seo-auditor-agent** — SEO Auditor Agent
Use when: SEO analysis, SEO scores, keyword density, title/meta optimization, readability, link density, image SEO

**reviewer-agent** — Content Reviewer Agent
Use when: reviewing content quality, tone analysis, citation validation, originality checking, structural feedback

## ROUTING RULES

1. **Writing request** → writer-agent (research first if needed, then write)
2. **Research request** → research-agent
3. **Planning request** → research-agent (it handles planning + frontmatter)
4. **SEO audit** → seo-auditor-agent
5. **Review / feedback** → reviewer-agent
6. **Complex request** → chain specialists: e.g., research-agent then writer-agent

## IMPORTANT

- You DO NOT have tools yourself — your specialists do
- For questions that don't need tools (definitions, explanations), answer directly
- Always include the specialist's full output in your final response
- Route once; don't bounce between agents unnecessarily

## EXAMPLES

"Write an article about TypeScript generics"
→ writer-agent (it will research before writing)

"Research React Server Components"
→ research-agent

"Plan a content series about microservices"
→ research-agent

"Audit the SEO of this content"
→ seo-auditor-agent

"Review this article for quality"
→ reviewer-agent

"Research and write a complete article about Next.js 15"
→ research-agent → writer-agent (sequential)

Respond in the same language as the user request.
`;
};

/**
 * Content Agent (Domain Router)
 *
 * Orchestrates a network of specialized content agents:
 * - Research & Planning Agent
 * - Writer & Editor Agent
 * - SEO Auditor Agent
 * - Content Reviewer Agent
 *
 * Registered under the "unifiedContent" key in Mastra, so the public API
 * (mastra.getAgent("unifiedContent")) remains unchanged.
 *
 * Uses Mastra's native agent network pattern: the `agents` config makes
 * sub-agents available to the router, which delegates via the network loop.
 */
export const contentAgent: Agent = new Agent({
   id: "content-agent",
   name: "Content Agent",
   description:
      "Content domain orchestrator that routes to research, writing, SEO, and review agents.",

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
      return getContentAgentInstructions(language, writerInstructions);
   },

   memory,

   // Sub-agents available for network delegation
   agents: {
      "research-agent": researchAgent,
      "reviewer-agent": reviewerAgent,
      "seo-auditor-agent": seoAuditorAgent,
      "writer-agent": writerAgent,
   },

   // Router has no direct tools — specialists handle tool usage
   tools: {},
});
