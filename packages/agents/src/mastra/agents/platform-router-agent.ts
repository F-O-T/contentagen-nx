// packages/agents/src/mastra/agents/platform-router-agent.ts
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { DEFAULT_CONTENT_MODEL_ID } from "../../models";
import {
   buildLanguageInstruction,
   compileInstructionMemories,
} from "../../utils";
import { contentAgent } from "./content-agent";

const memory = new Memory({
   options: {
      lastMessages: 30,
      generateTitle: {
         model: "openrouter/google/gemini-2.5-flash-lite",
      },
   },
});

const getPlatformRouterInstructions = (
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

# PLATFORM ROUTER

You are the top-level orchestrator for the Contentta platform.
Your job: understand what the user wants and route to the right domain agent, or answer directly.

## YOUR AGENTS

**content-agent** — Content Domain Agent
Use when: anything related to content creation, writing, research, SEO, review, editing, planning articles

## ROUTING RULES

1. **Content-related request** → content-agent (pass the full message including any routing prefixes)
2. **Platform question** (how to use the platform, navigation, features) → answer directly
3. **Prefixed request** (e.g., "[Usar writer-agent]: ...") → content-agent (it will handle the prefix)

## IMPORTANT

- You DO NOT have tools yourself — content-agent and its specialists do
- For simple questions (definitions, how-to platform help), answer directly without routing
- Always include the agent's full output in your final response
- Pass routing prefixes (e.g., "[Usar writer-agent]:") unchanged to content-agent

Respond in the same language as the user request.
`;
};

export const platformRouterAgent: Agent = new Agent({
   id: "platform-router-agent",
   name: "Platform Router Agent",
   description:
      "Top-level platform orchestrator. Routes content tasks to content-agent and answers platform questions directly.",

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
      return getPlatformRouterInstructions(language, writerInstructions);
   },

   memory,

   agents: {
      "content-agent": contentAgent,
   },

   tools: {},
});
