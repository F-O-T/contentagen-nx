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
Inserts an image into the blog post using a URL provided by the user.

**When to use:** When the user provides an image URL to add to the content.

**Parameters:**
- url (string): Full image URL provided by the user (REQUIRED)
- alt (string): Descriptive alt text for accessibility and SEO (REQUIRED)
- caption (string, optional): Caption below the image
- position (enum): Where to insert - "cursor", "afterParagraph", "end"
- width (enum, optional): "small", "medium", "large", "full"

**Example:**
If the user says "Add this image: https://example.com/photo.jpg"

insertImage({
  url: "https://example.com/photo.jpg",
  alt: "Descriptive text for the image",
  position: "end"
})

**DO NOT:**
- Search for images automatically - wait for the user to provide a URL
- Use placeholder URLs or made-up URLs
- Write markdown syntax like ![alt](url) in text - use this tool instead
`;
}
