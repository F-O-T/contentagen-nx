import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const insertImageTool = createTool({
   id: "insert-image",
   description:
      "Inserts an image into the blog post. Includes alt text for accessibility and optional caption.",
   inputSchema: z.object({
      url: z.string().url().describe("URL of the image"),
      alt: z
         .string()
         .describe(
            "Alt text describing the image for accessibility and SEO. Be descriptive.",
         ),
      caption: z
         .string()
         .optional()
         .describe("Optional caption to display below the image"),
      position: z
         .enum(["cursor", "afterParagraph", "end"])
         .default("cursor")
         .describe("Where to insert the image"),
      paragraphIndex: z
         .number()
         .optional()
         .describe("Paragraph index for afterParagraph position"),
      width: z
         .enum(["small", "medium", "large", "full"])
         .optional()
         .default("full")
         .describe("Display width of the image"),
   }),
   outputSchema: z.object({
      success: z.boolean(),
      url: z.string(),
      alt: z.string(),
   }),
   execute: async (inputData) => {
      return {
         success: true,
         url: inputData.url,
         alt: inputData.alt,
      };
   },
});
