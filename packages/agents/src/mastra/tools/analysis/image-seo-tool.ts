import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const ImageInfoSchema = z.object({
   src: z.string(),
   alt: z.string(),
   hasAlt: z.boolean(),
   altQuality: z.enum(["good", "poor", "missing"]),
});

const PlacementSuggestionSchema = z.object({
   afterHeading: z.string(),
   reason: z.string(),
});

const ImageSeoInputSchema = z.object({
   content: z.string().describe("Markdown content"),
   wordCount: z.number().describe("Total word count"),
   headings: z.array(z.string()).describe("List of headings in the content"),
});

const ImageSeoOutputSchema = z.object({
   imageCount: z.number(),
   recommendedCount: z.number(),
   images: z.array(ImageInfoSchema),
   score: z.number().min(0).max(100),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
   suggestedPlacements: z.array(PlacementSuggestionSchema),
});

// Image markdown pattern: ![alt](src) or ![alt](src "title")
const IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

// Keywords that suggest good alt text
const DESCRIPTIVE_PATTERNS = [
   /\b(?:imagem|foto|ilustra[çc][aã]o|gr[aá]fico|diagrama|tabela|screenshot|captura)\b/i,
   /\b(?:image|photo|illustration|graphic|diagram|table|chart|screenshot)\b/i,
   /\b(?:mostrando|exibindo|apresentando|demonstrando|showing|displaying)\b/i,
];

function assessAltQuality(alt: string): "good" | "poor" | "missing" {
   if (!alt || alt.trim() === "") {
      return "missing";
   }

   // Poor: too short, just filename-like, or generic
   if (alt.length < 10) {
      return "poor";
   }

   if (/^(?:image|img|foto|imagem)\d*$/i.test(alt)) {
      return "poor";
   }

   if (/^[a-z0-9_-]+\.[a-z]+$/i.test(alt)) {
      return "poor";
   }

   // Good: descriptive
   if (DESCRIPTIVE_PATTERNS.some((p) => p.test(alt))) {
      return "good";
   }

   // Medium length with words = acceptable
   if (alt.split(/\s+/).length >= 3) {
      return "good";
   }

   return "poor";
}

function parseImages(
   content: string,
): z.infer<typeof ImageSeoOutputSchema>["images"] {
   const images: z.infer<typeof ImageSeoOutputSchema>["images"] = [];
   let match: RegExpExecArray | null = IMAGE_PATTERN.exec(content);

   while (match !== null) {
      const alt = match[1] || "";
      const src = match[2] || "";

      images.push({
         src,
         alt,
         hasAlt: alt.trim() !== "",
         altQuality: assessAltQuality(alt),
      });

      match = IMAGE_PATTERN.exec(content);
   }

   return images;
}

function calculateRecommendedImages(wordCount: number): number {
   // Recommend 1 image per 300-500 words
   // Minimum 1, maximum based on content length
   if (wordCount < 300) return 1;
   if (wordCount < 800) return 2;
   if (wordCount < 1500) return 3;
   if (wordCount < 2500) return 5;
   return Math.min(8, Math.ceil(wordCount / 400));
}

function suggestImagePlacements(
   headings: string[],
   imageCount: number,
   recommendedCount: number,
): z.infer<typeof ImageSeoOutputSchema>["suggestedPlacements"] {
   const suggestions: z.infer<
      typeof ImageSeoOutputSchema
   >["suggestedPlacements"] = [];

   if (imageCount >= recommendedCount) {
      return suggestions;
   }

   const neededImages = recommendedCount - imageCount;

   // Prioritize headings that suggest visual content
   const visualKeywords =
      /(?:como|how|passo|step|exemplo|example|processo|process|resultado|result|compara|compare|gr[aá]fico|chart|dashboard|interface)/i;

   // First pass: headings with visual keywords
   for (const heading of headings) {
      if (suggestions.length >= neededImages) break;

      if (visualKeywords.test(heading)) {
         suggestions.push({
            afterHeading: heading,
            reason: `Visual content would help illustrate "${heading.slice(0, 50)}"`,
         });
      }
   }

   // Second pass: every 2-3 headings if still needed
   let headingIndex = 0;
   for (const heading of headings) {
      if (suggestions.length >= neededImages) break;

      if (
         headingIndex % 2 === 0 &&
         !suggestions.some((s) => s.afterHeading === heading)
      ) {
         suggestions.push({
            afterHeading: heading,
            reason: "Add visual break to improve readability",
         });
      }
      headingIndex++;
   }

   return suggestions;
}

export const imageSeoTool = createTool({
   id: "imageSeo",
   description:
      "Analyze image presence, alt text quality, and suggest placements for SEO optimization.",
   inputSchema: ImageSeoInputSchema,
   outputSchema: ImageSeoOutputSchema,
   execute: async (input) => {
      const { content, wordCount, headings } = input;

      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      const images = parseImages(content);
      const imageCount = images.length;
      const recommendedCount = calculateRecommendedImages(wordCount);

      // Check image count
      if (imageCount === 0) {
         issues.push("No images found in content");
         suggestions.push(
            `Add ${recommendedCount} images with descriptive alt text`,
         );
         score -= 30;
      } else if (imageCount < recommendedCount) {
         issues.push(
            `Few images for content length (${imageCount}/${recommendedCount} recommended)`,
         );
         suggestions.push(
            `Consider adding ${recommendedCount - imageCount} more images`,
         );
         score -= 15;
      }

      // Check alt text quality
      const missingAlt = images.filter((img) => !img.hasAlt).length;
      const poorAlt = images.filter((img) => img.altQuality === "poor").length;

      if (missingAlt > 0) {
         issues.push(`${missingAlt} image(s) missing alt text`);
         suggestions.push("Add descriptive alt text to all images");
         score -= missingAlt * 10;
      }

      if (poorAlt > 0) {
         issues.push(`${poorAlt} image(s) have poor quality alt text`);
         suggestions.push(
            "Improve alt text to be more descriptive (include what the image shows and relevant keywords)",
         );
         score -= poorAlt * 5;
      }

      // General suggestions
      if (images.length > 0) {
         const hasGoodAlt = images.some((img) => img.altQuality === "good");
         if (!hasGoodAlt) {
            suggestions.push(
               "Make alt text descriptive: describe what the image shows and include relevant keywords naturally",
            );
         }
      }

      const suggestedPlacements = suggestImagePlacements(
         headings,
         imageCount,
         recommendedCount,
      );

      return {
         imageCount,
         recommendedCount,
         images,
         score: Math.max(0, score),
         issues,
         suggestions,
         suggestedPlacements,
      };
   },
});
