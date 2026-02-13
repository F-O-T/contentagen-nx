import { createTool } from "@mastra/core/tools";
import type { InstructionMemoryItem } from "@packages/database/schemas/instruction-memory";
import { z } from "zod";

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
