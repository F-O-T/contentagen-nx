import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const writeContentTool = createTool({
  id: "write-content",
  description:
    "Writes a full content section (heading + body) to the editor. Use one call per section with the H2 heading and all paragraphs combined as a single markdown string.",
  inputSchema: z.object({
    markdown: z
      .string()
      .describe(
        "The full markdown content for this section, including the H2 heading (## Título) followed by all paragraphs. Minimum 200 words per section.",
      ),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
  execute: async (inputData, context) => {
    const { markdown } = inputData;

    const onBodyUpdate = context?.requestContext?.get("onBodyUpdate") as
      | ((toolName: string, output: Record<string, unknown>) => Promise<void>)
      | undefined;

    if (onBodyUpdate) {
      try {
        await onBodyUpdate("write-content", { markdown });
      } catch (err) {
        // best-effort — don't fail the tool if the update callback throws
        console.error("[write-content] onBodyUpdate failed:", err);
      }
    }

    return { success: true };
  },
});
