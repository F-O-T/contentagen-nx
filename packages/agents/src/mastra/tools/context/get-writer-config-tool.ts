import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export function getWriterConfigInstructions(): string {
   return `
## GET WRITER CONFIG TOOL
Retrieves the writer style configuration if one exists.

**When to use:**
- At the START of writing to check if there are any style preferences

**Parameters:** None

**Returns:**
- hasConfig: false (configurations are now managed via instruction memories)
- message: Guidance to use built-in guidelines

**Note:** Writer preferences are now configured via instruction memories which are automatically included in your system prompt.
`;
}

export const getWriterConfigTool = createTool({
   id: "get-writer-config",
   description:
      "Retrieves the writer style configuration from context. Call this at the start of writing to check style preferences.",
   inputSchema: z.object({}),
   execute: async () => {
      // Writer configurations are now managed via instruction memories
      // which are compiled into the agent's system prompt
      return {
         hasConfig: false,
         message:
            "No structured config. Use your built-in writing guidelines and any instruction memories in your system prompt.",
      };
   },
});
