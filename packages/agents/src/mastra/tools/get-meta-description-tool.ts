import { createTool } from "@mastra/core";
import z from "zod";

export const getMetaDescriptionTool = createTool({
   id: "generate-meta-description",
   description:
      "Generates a meta description from the first paragraph of content. Strips markdown formatting and truncates at word boundaries.",
   inputSchema: z.object({
      text: z.string().describe("The full content text"),
      maxLength: z.number().default(160).describe("Maximum description length"),
   }),
   outputSchema: z.object({
      metaDescription: z.string().describe("SEO-optimized meta description"),
   }),
   execute: async ({ context }) => {
      const { text, maxLength = 160 } = context;
      const firstParagraph =
         text
            .replace(/^#{1,6}\s.+$/gm, "")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .trim()
            .split("\n\n")[0] || "";

      let metaDescription: string;
      if (firstParagraph.length <= maxLength) {
         metaDescription = firstParagraph;
      } else {
         const truncated = firstParagraph.substring(0, maxLength);
         const lastSpace = truncated.lastIndexOf(" ");
         metaDescription =
            lastSpace > 0
               ? `${truncated.substring(0, lastSpace)}...`
               : `${truncated}...`;
      }

      return { metaDescription };
   },
});
