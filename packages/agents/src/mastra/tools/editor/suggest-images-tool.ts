import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const ImageSuggestionSchema = z.object({
   afterHeading: z.string(),
   imageType: z.enum(["screenshot", "diagram", "infographic", "photo"]),
   suggestedAlt: z.string(),
   searchQuery: z.string(),
   reason: z.string(),
});

const SuggestImagesInputSchema = z.object({
   content: z.string().describe("Full markdown content"),
   headings: z.array(z.string()).describe("List of headings"),
   topic: z.string().describe("Main topic"),
   targetKeywords: z.array(z.string()).describe("Keywords for alt text"),
});

const SuggestImagesOutputSchema = z.object({
   success: z.boolean(),
   suggestions: z.array(ImageSuggestionSchema),
   recommendedCount: z.number(),
});

// Heading patterns that suggest specific image types
const IMAGE_TYPE_PATTERNS = {
   screenshot: [
      /\b(?:como|how\s+to|passo|step|tutorial|interface|dashboard|configurar|setup)\b/i,
   ],
   diagram: [
      /\b(?:processo|process|fluxo|flow|arquitetura|architecture|estrutura|structure)\b/i,
   ],
   infographic: [
      /\b(?:dados|data|estatísticas|statistics|comparação|comparison|métricas|metrics)\b/i,
   ],
   photo: [
      /\b(?:exemplo|example|caso|case|resultado|result|antes\s+e\s+depois)\b/i,
   ],
};

function detectLanguage(text: string): "pt" | "en" {
   const ptIndicators = /\b(de|da|do|em|para|que|como|é|são|está|um|uma)\b/i;
   return ptIndicators.test(text) ? "pt" : "en";
}

function determineImageType(
   heading: string,
): "screenshot" | "diagram" | "infographic" | "photo" {
   for (const [type, patterns] of Object.entries(IMAGE_TYPE_PATTERNS)) {
      if (patterns.some((p) => p.test(heading))) {
         return type as "screenshot" | "diagram" | "infographic" | "photo";
      }
   }
   return "photo"; // Default
}

function generateAltText(
   heading: string,
   imageType: string,
   keywords: string[],
   language: "pt" | "en",
): string {
   const cleanHeading = heading.replace(/^#+\s*/, "").trim();
   const keyword = keywords[0] || "topic";

   const templates = {
      screenshot: {
         pt: `Captura de tela mostrando ${cleanHeading.toLowerCase()} para ${keyword}`,
         en: `Screenshot showing ${cleanHeading.toLowerCase()} for ${keyword}`,
      },
      diagram: {
         pt: `Diagrama ilustrando ${cleanHeading.toLowerCase()} em ${keyword}`,
         en: `Diagram illustrating ${cleanHeading.toLowerCase()} in ${keyword}`,
      },
      infographic: {
         pt: `Infográfico com dados sobre ${cleanHeading.toLowerCase()} em ${keyword}`,
         en: `Infographic with data about ${cleanHeading.toLowerCase()} in ${keyword}`,
      },
      photo: {
         pt: `Imagem representando ${cleanHeading.toLowerCase()} relacionado a ${keyword}`,
         en: `Image representing ${cleanHeading.toLowerCase()} related to ${keyword}`,
      },
   };

   const template =
      templates[imageType as keyof typeof templates] || templates.photo;
   return language === "pt" ? template.pt : template.en;
}

function generateSearchQuery(
   heading: string,
   imageType: string,
   topic: string,
): string {
   const cleanHeading = heading.replace(/^#+\s*/, "").trim();

   const typeTerms = {
      screenshot: "interface screenshot",
      diagram: "process diagram flowchart",
      infographic: "infographic data visualization",
      photo: "professional photo",
   };

   const typeTerm = typeTerms[imageType as keyof typeof typeTerms] || "image";
   return `${topic} ${cleanHeading} ${typeTerm}`.slice(0, 100);
}

function generateReason(
   heading: string,
   imageType: string,
   language: "pt" | "en",
): string {
   const cleanHeading = heading.replace(/^#+\s*/, "").slice(0, 40);

   const reasons = {
      screenshot: {
         pt: `Um screenshot ajudaria leitores a visualizar "${cleanHeading}"`,
         en: `A screenshot would help readers visualize "${cleanHeading}"`,
      },
      diagram: {
         pt: `Um diagrama tornaria "${cleanHeading}" mais fácil de entender`,
         en: `A diagram would make "${cleanHeading}" easier to understand`,
      },
      infographic: {
         pt: `Um infográfico resumiria os dados de "${cleanHeading}"`,
         en: `An infographic would summarize the data in "${cleanHeading}"`,
      },
      photo: {
         pt: `Uma imagem quebraria o texto e ilustraria "${cleanHeading}"`,
         en: `An image would break up the text and illustrate "${cleanHeading}"`,
      },
   };

   const reason = reasons[imageType as keyof typeof reasons] || reasons.photo;
   return language === "pt" ? reason.pt : reason.en;
}

function calculateRecommendedImages(
   wordCount: number,
   headingCount: number,
): number {
   // At least 1 image per 500 words, but also consider section count
   const byWords = Math.max(1, Math.ceil(wordCount / 500));
   const byHeadings = Math.max(1, Math.ceil(headingCount / 3));
   return Math.min(8, Math.max(byWords, byHeadings));
}

export const suggestImagesTool = createTool({
   id: "suggestImages",
   description:
      "Suggest optimal image placements with alt text and search queries.",
   inputSchema: SuggestImagesInputSchema,
   outputSchema: SuggestImagesOutputSchema,
   execute: async (input) => {
      const { content, headings, topic, targetKeywords } = input;

      const language = detectLanguage(content);
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const recommendedCount = calculateRecommendedImages(
         wordCount,
         headings.length,
      );

      const suggestions: z.infer<
         typeof SuggestImagesOutputSchema
      >["suggestions"] = [];

      // Score headings for image potential
      const scoredHeadings = headings.map((heading) => {
         let score = 0;

         // Visual content indicators
         if (IMAGE_TYPE_PATTERNS.screenshot.some((p) => p.test(heading)))
            score += 3;
         if (IMAGE_TYPE_PATTERNS.diagram.some((p) => p.test(heading)))
            score += 3;
         if (IMAGE_TYPE_PATTERNS.infographic.some((p) => p.test(heading)))
            score += 2;
         if (IMAGE_TYPE_PATTERNS.photo.some((p) => p.test(heading))) score += 1;

         // Length bonus (longer headings often describe more complex topics)
         if (heading.length > 40) score += 1;

         return { heading, score };
      });

      // Sort by score and select top candidates
      const topCandidates = scoredHeadings
         .sort((a, b) => b.score - a.score)
         .slice(0, recommendedCount);

      // If not enough high-scoring headings, add evenly spaced ones
      if (topCandidates.length < recommendedCount) {
         const remaining = recommendedCount - topCandidates.length;
         const interval = Math.ceil(headings.length / remaining);
         let index = 0;

         for (let i = 0; i < remaining; i++) {
            const heading = headings[index];
            if (
               heading &&
               !topCandidates.some((tc) => tc.heading === heading)
            ) {
               topCandidates.push({ heading, score: 0 });
            }
            index += interval;
         }
      }

      // Generate suggestions
      for (const { heading } of topCandidates.slice(0, recommendedCount)) {
         const imageType = determineImageType(heading);

         suggestions.push({
            afterHeading: heading,
            imageType,
            suggestedAlt: generateAltText(
               heading,
               imageType,
               targetKeywords,
               language,
            ),
            searchQuery: generateSearchQuery(heading, imageType, topic),
            reason: generateReason(heading, imageType, language),
         });
      }

      return {
         success: suggestions.length > 0,
         suggestions,
         recommendedCount,
      };
   },
});

export function getSuggestImagesInstructions(): string {
   return `
## SUGGEST IMAGES TOOL
Generates image placement suggestions with alt text and search queries.

**When to use:** After imageSeo analysis shows missing or few images.

**Input:**
- content (string): Full markdown content
- headings (array): List of H2/H3 headings
- topic (string): Main topic
- targetKeywords (array): Keywords for SEO-optimized alt text

**Output:**
- success: Whether suggestions were generated
- suggestions: Array with:
  - afterHeading: Which heading to place image after
  - imageType: "screenshot" | "diagram" | "infographic" | "photo"
  - suggestedAlt: SEO-optimized alt text
  - searchQuery: Query to find relevant images
  - reason: Why this image would help
- recommendedCount: Total images recommended

**Image Type Selection:**
- screenshot: For tutorials, interfaces, configuration
- diagram: For processes, flows, architecture
- infographic: For data, statistics, comparisons
- photo: For examples, cases, general illustration

**Example Suggestion:**
{
  "afterHeading": "## Como Otimizar para AI Overviews",
  "imageType": "screenshot",
  "suggestedAlt": "Captura de tela mostrando AI Overview no Google para SEO 2026",
  "searchQuery": "SEO 2026 AI Overview Google interface screenshot",
  "reason": "Um screenshot ajudaria leitores a visualizar AI Overviews"
}
`;
}
