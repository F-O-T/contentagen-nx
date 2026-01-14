import { createTool } from "@mastra/core/tools";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { z } from "zod";

export function getInstructionsToolInstructions(): string {
   return `
## GET INSTRUCTION MEMORIES TOOL
Retrieves custom instruction memories configured for this agent.

**When to use:**
- When you need to recall persistent instructions or preferences
- To check what custom rules or guidelines have been configured
- When you want to ensure you're following user-configured instructions

**Parameters:**
- enabledOnly (optional, default: true): Only return enabled instructions
- limit (optional): Maximum number of instructions to return

**Returns:**
- instructions: Array of instruction objects with:
  - id: Unique identifier
  - title: Short title describing the instruction
  - content: Full markdown content of the instruction
  - enabled: Whether this instruction is active
  - order: Sort order for the instruction
- count: Total number of instructions returned

**Note:** Instructions are automatically compiled into your system prompt, but this tool lets you explicitly reference them during execution.
`;
}

export const getInstructionsTool = createTool({
   id: "getInstructionMemories",
   description:
      "Retrieves the agent's custom instruction memories. Use this to recall persistent instructions, preferences, and learned information configured for this agent.",
   inputSchema: z.object({
      enabledOnly: z
         .boolean()
         .optional()
         .default(true)
         .describe("Only return enabled instructions"),
      limit: z
         .number()
         .int()
         .positive()
         .optional()
         .describe("Maximum number of instructions to return"),
   }),
   execute: async (input, context) => {
      const requestContext = context?.requestContext;
      const writerInstructions = requestContext?.get("writerInstructions") as
         | InstructionMemoryItem[]
         | undefined;

      if (!writerInstructions || writerInstructions.length === 0) {
         return {
            instructions: [],
            count: 0,
            message: "No instruction memories configured for this agent.",
         };
      }

      // Filter and sort instructions
      let filtered = [...writerInstructions].sort((a, b) => a.order - b.order);

      if (input.enabledOnly) {
         filtered = filtered.filter((i) => i.enabled);
      }

      if (input.limit && input.limit > 0) {
         filtered = filtered.slice(0, input.limit);
      }

      return {
         instructions: filtered.map((i) => ({
            id: i.id,
            title: i.title,
            content: i.content,
            enabled: i.enabled,
            order: i.order,
         })),
         count: filtered.length,
      };
   },
});
