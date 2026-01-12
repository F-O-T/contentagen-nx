import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";

export type MastraLLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

/**
 * Compiles instruction memories into a formatted markdown string
 * for the agent's system prompt.
 *
 * Only enabled instructions are included, sorted by their order value.
 */
export function compileInstructionMemories(
   agentInstructions: InstructionMemoryItem[],
): string {
   // Filter enabled instructions and sort by order
   const enabledInstructions = agentInstructions
      .filter((i) => i.enabled)
      .sort((a, b) => a.order - b.order);

   if (enabledInstructions.length === 0) {
      return "";
   }

   const content = enabledInstructions
      .map((i) => `### ${i.title}\n${i.content}`)
      .join("\n\n");

   return `
# INSTRUCTION MEMORIES
The following instructions have been configured as persistent memories for this agent.

## WRITER INSTRUCTIONS
${content}
`;
}
