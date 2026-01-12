import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const LinkInfoSchema = z.object({
   url: z.string(),
   anchor: z.string(),
});

const ExternalLinkInfoSchema = LinkInfoSchema.extend({
   domain: z.string(),
});

const LinkDensityInputSchema = z.object({
   content: z.string().describe("Markdown content"),
   wordCount: z.number().describe("Total word count"),
   topic: z.string().describe("Main topic for context"),
});

const LinkDensityOutputSchema = z.object({
   internalLinks: z.array(LinkInfoSchema),
   externalLinks: z.array(ExternalLinkInfoSchema),
   internalCount: z.number(),
   externalCount: z.number(),
   recommendedInternalCount: z.number(),
   recommendedExternalCount: z.number(),
   score: z.number().min(0).max(100),
   issues: z.array(z.string()),
   suggestions: z.array(z.string()),
});

// Link markdown pattern: [anchor](url)
// Negative lookbehind to exclude image links ![alt](url)
const LINK_PATTERN = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g;

function extractDomain(url: string): string {
   try {
      // Handle relative URLs
      if (url.startsWith("/") || url.startsWith("#")) {
         return "internal";
      }

      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, "");
   } catch {
      // If URL parsing fails, try to extract domain manually
      const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/);
      return match?.[1] ?? "unknown";
   }
}

function isInternalLink(url: string): boolean {
   // Internal links start with / or # or are relative
   if (url.startsWith("/") || url.startsWith("#") || url.startsWith("./")) {
      return true;
   }

   // Check for common internal patterns
   if (url.startsWith("blog/") || url.startsWith("../")) {
      return true;
   }

   // External links have protocol
   if (url.startsWith("http://") || url.startsWith("https://")) {
      return false;
   }

   // Assume other patterns are internal
   return true;
}

function parseLinks(content: string): {
   internal: z.infer<typeof LinkDensityOutputSchema>["internalLinks"];
   external: z.infer<typeof LinkDensityOutputSchema>["externalLinks"];
} {
   const internal: z.infer<typeof LinkDensityOutputSchema>["internalLinks"] =
      [];
   const external: z.infer<typeof LinkDensityOutputSchema>["externalLinks"] =
      [];

   let match: RegExpExecArray | null = LINK_PATTERN.exec(content);

   while (match !== null) {
      const anchor = match[1] || "";
      const url = match[2] || "";

      if (isInternalLink(url)) {
         internal.push({ url, anchor });
      } else {
         external.push({
            url,
            anchor,
            domain: extractDomain(url),
         });
      }

      match = LINK_PATTERN.exec(content);
   }

   return { internal, external };
}

function calculateRecommendedLinks(wordCount: number): {
   internal: number;
   external: number;
} {
   // Recommend 2-4 internal links per 1000 words
   // Recommend 1-2 external links per 1000 words
   const factor = wordCount / 1000;

   return {
      internal: Math.max(2, Math.round(factor * 3)), // 3 per 1000 words
      external: Math.max(1, Math.round(factor * 1.5)), // 1.5 per 1000 words
   };
}

function assessAnchorQuality(anchor: string): "good" | "poor" {
   // Poor: generic anchors
   const genericAnchors =
      /^(?:aqui|clique|saiba mais|leia mais|here|click|read more|learn more|link)$/i;
   if (genericAnchors.test(anchor.trim())) {
      return "poor";
   }

   // Poor: too short
   if (anchor.length < 3) {
      return "poor";
   }

   // Poor: just URL
   if (/^https?:\/\//.test(anchor)) {
      return "poor";
   }

   return "good";
}

export const linkDensityTool = createTool({
   id: "linkDensity",
   description:
      "Analyze internal and external link density relative to content length.",
   inputSchema: LinkDensityInputSchema,
   outputSchema: LinkDensityOutputSchema,
   execute: async (input) => {
      const { content, wordCount } = input;

      const issues: string[] = [];
      const suggestions: string[] = [];
      let score = 100;

      const { internal, external } = parseLinks(content);
      const recommended = calculateRecommendedLinks(wordCount);

      const internalCount = internal.length;
      const externalCount = external.length;

      // Check internal links
      if (internalCount === 0) {
         issues.push("No internal links found");
         suggestions.push(
            `Add ${recommended.internal} internal links to related content`,
         );
         score -= 25;
      } else if (internalCount < recommended.internal) {
         issues.push(
            `Few internal links (${internalCount}/${recommended.internal} recommended)`,
         );
         suggestions.push(
            `Add ${recommended.internal - internalCount} more internal links to related blog posts`,
         );
         score -= 15;
      }

      // Check external links
      if (externalCount === 0) {
         issues.push("No external links to authoritative sources");
         suggestions.push(
            `Add ${recommended.external} external links to authoritative sources`,
         );
         score -= 20;
      } else if (externalCount < recommended.external) {
         issues.push(
            `Few external links (${externalCount}/${recommended.external} recommended)`,
         );
         suggestions.push(
            "Add more external links to authoritative sources to support claims",
         );
         score -= 10;
      }

      // Check anchor text quality
      const allLinks = [...internal, ...external];
      const poorAnchors = allLinks.filter(
         (link) => assessAnchorQuality(link.anchor) === "poor",
      );

      if (poorAnchors.length > 0) {
         issues.push(`${poorAnchors.length} link(s) have poor anchor text`);
         suggestions.push(
            'Use descriptive anchor text instead of generic phrases like "clique aqui" or "saiba mais"',
         );
         score -= poorAnchors.length * 5;
      }

      // Check for link diversity (not all links to same domain)
      const externalDomains = new Set(external.map((link) => link.domain));
      if (externalCount > 2 && externalDomains.size === 1) {
         suggestions.push(
            "Consider linking to multiple authoritative sources for better credibility",
         );
         score -= 5;
      }

      // Suggestions for good linking
      if (internalCount > 0 && externalCount > 0) {
         const ratio = internalCount / externalCount;
         if (ratio < 1) {
            suggestions.push(
               "Consider adding more internal links to keep readers on your site",
            );
         }
      }

      return {
         internalLinks: internal,
         externalLinks: external,
         internalCount,
         externalCount,
         recommendedInternalCount: recommended.internal,
         recommendedExternalCount: recommended.external,
         score: Math.max(0, score),
         issues,
         suggestions,
      };
   },
});

export function getLinkDensityInstructions(): string {
   return `
## LINK DENSITY ANALYSIS TOOL
Analyzes internal and external link count relative to content length.

**When to use:** To check if content has appropriate linking for SEO and user navigation.

**Input:**
- content (string): Full markdown content
- wordCount (number): Total word count
- topic (string): Main topic (for context)

**Output:**
- internalLinks: Array of internal links with URL and anchor
- externalLinks: Array of external links with URL, anchor, and domain
- internalCount/externalCount: Total counts
- recommendedInternalCount/recommendedExternalCount: Suggested counts based on length
- score: 0-100 score
- issues: Problems found
- suggestions: Improvement recommendations

**Link Recommendations:**
- Internal: 2-4 links per 1000 words
- External: 1-2 links per 1000 words to authoritative sources
- Use descriptive anchor text (not "clique aqui" or "saiba mais")

**Example:**
\`\`\`json
{
  "content": "Check our [SEO guide](/blog/seo-guide) for more...",
  "wordCount": 2357,
  "topic": "SEO 2026"
}
\`\`\`
`;
}
