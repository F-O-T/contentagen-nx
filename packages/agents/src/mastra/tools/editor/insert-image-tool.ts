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

export function getInsertImageInstructions(): string {
   return `
## INSERT IMAGE TOOL
Inserts an image into the blog post using a URL from searchImage results.

**IMPORTANT WORKFLOW:**
1. FIRST call searchImage to find relevant images
2. Review the returned URLs and pick the best one
3. THEN call insertImage with the URL and a descriptive alt text

**DO NOT:**
- Use placeholder URLs or made-up URLs
- Write markdown syntax like ![alt](url) in text - use this tool instead
- Skip the searchImage step - always search first

**Parameters:**
- url (string): Full URL from searchImage results (REQUIRED)
- alt (string): Descriptive alt text for accessibility and SEO (REQUIRED)
- caption (string, optional): Caption below the image
- position (enum): Where to insert - "cursor", "afterParagraph", "end"
- width (enum, optional): "small", "medium", "large", "full"

**Example workflow:**
1. searchImage({ query: "team collaboration office", count: 3 })
2. Review results, pick best URL
3. insertImage({ 
     url: "https://images.unsplash.com/photo-xxx", 
     alt: "Team collaborating around a whiteboard in a modern office",
     caption: "Effective collaboration leads to better outcomes",
     position: "end"
   })
`;
}
