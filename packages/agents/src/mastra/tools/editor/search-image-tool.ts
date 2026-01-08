import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createClient } from "pexels";
import { createApi } from "unsplash-js";
import { z } from "zod";

// Initialize Unsplash client if API key is available
const unsplash = serverEnv.UNSPLASH_ACCESS_KEY
   ? createApi({ accessKey: serverEnv.UNSPLASH_ACCESS_KEY })
   : null;

// Initialize Pexels client if API key is available
const pexels = serverEnv.PEXELS_API_KEY
   ? createClient(serverEnv.PEXELS_API_KEY)
   : null;

// Image result type
const ImageResultSchema = z.object({
   url: z.string().url(),
   alt: z.string(),
   photographer: z.string(),
   photographerUrl: z.string(),
   width: z.number(),
   height: z.number(),
   source: z.enum(["unsplash", "pexels"]),
});

type ImageResult = z.infer<typeof ImageResultSchema>;

/**
 * Search Unsplash for images
 */
async function searchUnsplash(
   query: string,
   count: number,
   orientation?: "landscape" | "portrait" | "squarish",
): Promise<ImageResult[]> {
   if (!unsplash) {
      throw new Error("Unsplash API key not configured");
   }

   const result = await unsplash.search.getPhotos({
      query,
      perPage: count,
      orientation,
   });

   if (result.errors) {
      throw new Error(`Unsplash error: ${result.errors.join(", ")}`);
   }

   if (!result.response?.results) {
      return [];
   }

   return result.response.results.map((photo) => ({
      url: photo.urls.regular,
      alt: photo.alt_description || photo.description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
      source: "unsplash" as const,
   }));
}

/**
 * Search Pexels for images
 */
async function searchPexels(
   query: string,
   count: number,
   orientation?: "landscape" | "portrait" | "squarish",
): Promise<ImageResult[]> {
   if (!pexels) {
      throw new Error("Pexels API key not configured");
   }

   // Convert "squarish" to "square" for Pexels API
   const pexelsOrientation =
      orientation === "squarish" ? "square" : orientation;

   const result = await pexels.photos.search({
      query,
      per_page: count,
      orientation: pexelsOrientation,
   });

   if ("error" in result) {
      throw new Error(`Pexels error: ${result.error}`);
   }

   return result.photos.map((photo) => ({
      url: photo.src.large,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      source: "pexels" as const,
   }));
}

export const searchImageTool = createTool({
   id: "search-image",
   description:
      "Searches for high-quality images from Unsplash (primary) or Pexels (fallback). Returns image URLs that can be used with insertImage tool.",
   inputSchema: z.object({
      query: z
         .string()
         .describe(
            "Search query for images (e.g., 'business meeting', 'coding laptop', 'nature landscape')",
         ),
      count: z
         .number()
         .min(1)
         .max(10)
         .optional()
         .default(5)
         .describe("Number of images to return (1-10)"),
      orientation: z
         .enum(["landscape", "portrait", "squarish"])
         .optional()
         .describe("Image orientation preference"),
   }),
   outputSchema: z.object({
      images: z.array(ImageResultSchema),
      query: z.string(),
      source: z.enum(["unsplash", "pexels", "none"]),
   }),
   execute: async (inputData) => {
      const { query, count = 5, orientation } = inputData;

      // Try Unsplash first
      if (unsplash) {
         try {
            const images = await searchUnsplash(query, count, orientation);
            if (images.length > 0) {
               return { images, query, source: "unsplash" as const };
            }
         } catch (error) {
            console.warn("Unsplash search failed, trying Pexels:", error);
         }
      }

      // Fallback to Pexels
      if (pexels) {
         try {
            const images = await searchPexels(query, count, orientation);
            if (images.length > 0) {
               return { images, query, source: "pexels" as const };
            }
         } catch (error) {
            console.warn("Pexels search failed:", error);
         }
      }

      // No API keys configured or both failed
      if (!unsplash && !pexels) {
         throw new Error(
            "No image API keys configured. Set UNSPLASH_ACCESS_KEY or PEXELS_API_KEY in environment.",
         );
      }

      return { images: [], query, source: "none" as const };
   },
});

export function getSearchImageInstructions(): string {
   return `
## SEARCH IMAGE TOOL
Searches Unsplash (primary) or Pexels (fallback) for high-quality images to include in your blog post.

**When to use:** BEFORE calling insertImage - always search for images first

**Parameters:**
- query (string): Descriptive search query for the image
- count (number, optional): Number of results (1-10, default 5)
- orientation (enum, optional): "landscape", "portrait", or "squarish"

**Returns:**
- images: Array of { url, alt, photographer, photographerUrl, width, height, source }
- query: The search query used
- source: Which API returned the results ("unsplash", "pexels", or "none")

**IMPORTANT WORKFLOW:**
1. First call searchImage to find relevant images
2. Review the returned URLs and pick the best one
3. Then call insertImage with the chosen URL and a descriptive alt text

**Example:**
searchImage({ query: "programming laptop coffee", count: 3, orientation: "landscape" })
Then use one of the returned URLs with insertImage tool.

**Attribution:** Unsplash images are free to use. Pexels images require photographer attribution (included in response).
`;
}
