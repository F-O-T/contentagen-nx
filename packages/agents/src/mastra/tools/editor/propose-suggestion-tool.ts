import { normalizeMarkdownEmphasis } from "@f-o-t/markdown";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const proposeSuggestionTool = createTool({
   id: "propose-suggestion",
   description:
      "Propose a text change as a track-change suggestion. The user can accept or reject it. Use when you want to rewrite or improve a specific passage.",
   inputSchema: z.object({
      blockId: z
         .string()
         .describe(
            "The block ID (Plate node ID) containing the text to change.",
         ),
      originalText: z
         .string()
         .describe(
            "The exact current text to be replaced (verbatim from the document).",
         ),
      suggestedText: z.string().describe("The proposed replacement text."),
      reason: z
         .string()
         .describe(
            "Brief explanation of why this change improves the content.",
         ),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      suggestionId: z.string(),
      blockId: z.string(),
      originalText: z.string(),
      suggestedText: z.string(),
      reason: z.string(),
   }),
   execute: async (input) => {
      const normalizedSuggestion = normalizeMarkdownEmphasis(
         input.suggestedText,
      );
      return {
         success: true,
         suggestionId: crypto.randomUUID(),
         blockId: input.blockId,
         originalText: input.originalText,
         suggestedText: normalizedSuggestion,
         reason: input.reason,
      };
   },
});
