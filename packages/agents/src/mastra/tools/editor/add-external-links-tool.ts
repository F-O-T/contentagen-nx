import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const LinkAddedSchema = z.object({
   domain: z.string(),
   url: z.string(),
   anchor: z.string(),
   insertedAt: z.string(),
});

const LinkSuggestionSchema = z.object({
   domain: z.string(),
   reason: z.string(),
   searchQuery: z.string(),
});

const AddExternalLinksInputSchema = z.object({
   content: z.string().describe("Content to add links to"),
   topic: z.string().describe("Main topic"),
   keywords: z.array(z.string()).describe("Keywords for link context"),
   maxLinks: z.number().optional().default(3).describe("Maximum links to add"),
});

const AddExternalLinksOutputSchema = z.object({
   success: z.boolean(),
   modifiedContent: z.string(),
   linksAdded: z.array(LinkAddedSchema),
   suggestions: z.array(LinkSuggestionSchema),
});

// Authoritative domains by topic
const AUTHORITATIVE_SOURCES: Record<
   string,
   Array<{ domain: string; type: string }>
> = {
   seo: [
      {
         domain: "google.com/search/howsearchworks",
         type: "Official Google documentation",
      },
      { domain: "searchengineland.com", type: "Industry news" },
      { domain: "moz.com", type: "SEO tools and research" },
      { domain: "ahrefs.com/blog", type: "SEO research and data" },
      { domain: "semrush.com/blog", type: "Marketing research" },
   ],
   marketing: [
      { domain: "hubspot.com/marketing", type: "Marketing education" },
      { domain: "marketingland.com", type: "Industry news" },
      { domain: "contentmarketinginstitute.com", type: "Content strategy" },
      { domain: "neilpatel.com", type: "Digital marketing expert" },
   ],
   technology: [
      { domain: "techcrunch.com", type: "Tech news" },
      { domain: "wired.com", type: "Tech analysis" },
      { domain: "arxiv.org", type: "Research papers" },
      { domain: "developer.google.com", type: "Official documentation" },
   ],
   research: [
      { domain: "statista.com", type: "Statistics database" },
      { domain: "pewresearch.org", type: "Research data" },
      { domain: "mckinsey.com", type: "Business research" },
      { domain: "gartner.com", type: "Industry analysis" },
   ],
   general: [
      { domain: "wikipedia.org", type: "Reference" },
      { domain: "harvard.edu", type: "Academic source" },
      { domain: "gov.br", type: "Government data" },
      { domain: ".edu", type: "Academic source" },
   ],
};

// Patterns that suggest need for external citation
const CITATION_PATTERNS = [
   { pattern: /(\d+(?:[,.]\d+)?)\s*%/g, type: "statistic" },
   { pattern: /segundo\s+(?:estudos|pesquisas|dados)/gi, type: "claim" },
   {
      pattern:
         /(?:pesquisa|study|research)\s+(?:mostra|shows|indica|reveals)/gi,
      type: "research",
   },
   { pattern: /(?:relatório|report)\s+(?:da|de|from)/gi, type: "report" },
   { pattern: /em\s+20\d{2}/gi, type: "dated_fact" },
];

function detectTopic(content: string, declaredTopic: string): string {
   const lowerContent = content.toLowerCase();

   if (
      /\b(?:seo|search\s+engine|google|ranking|serp|ai\s+overview)\b/i.test(
         lowerContent,
      )
   )
      return "seo";
   if (
      /\b(?:marketing|campanha|leads|conversão|engajamento)\b/i.test(
         lowerContent,
      )
   )
      return "marketing";
   if (
      /\b(?:ia|inteligência\s+artificial|machine\s+learning|tecnologia)\b/i.test(
         lowerContent,
      )
   )
      return "technology";
   if (
      /\b(?:dados|estatísticas|pesquisa|estudo|research)\b/i.test(lowerContent)
   )
      return "research";

   return declaredTopic.toLowerCase() in AUTHORITATIVE_SOURCES
      ? declaredTopic.toLowerCase()
      : "general";
}

function findCitationOpportunities(content: string): Array<{
   text: string;
   type: string;
   lineNumber: number;
   index: number;
}> {
   const opportunities: Array<{
      text: string;
      type: string;
      lineNumber: number;
      index: number;
   }> = [];

   const lines = content.split("\n");
   let charIndex = 0;

   for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum] || "";

      for (const { pattern, type } of CITATION_PATTERNS) {
         // Reset pattern for each line
         pattern.lastIndex = 0;
         let match: RegExpExecArray | null;

         // biome-ignore lint/suspicious/noAssignInExpressions: Standard regex iteration pattern
         while ((match = pattern.exec(line)) !== null) {
            // Check if already has a link nearby
            const context = line.slice(
               Math.max(0, match.index - 50),
               match.index + match[0].length + 50,
            );
            if (!/\[[^\]]+\]\([^)]+\)/.test(context)) {
               opportunities.push({
                  text: match[0],
                  type,
                  lineNumber: lineNum + 1,
                  index: charIndex + match.index,
               });
            }
         }
      }

      charIndex += line.length + 1; // +1 for newline
   }

   return opportunities;
}

function generateSearchQuery(
   text: string,
   topic: string,
   type: string,
): string {
   const cleanText = text.replace(/[%,.]/g, "").trim();

   switch (type) {
      case "statistic":
         return `${cleanText} percent ${topic} source study`;
      case "research":
         return `${topic} research study data`;
      case "report":
         return `${topic} report statistics`;
      case "dated_fact":
         return `${topic} ${cleanText} data`;
      default:
         return `${topic} ${cleanText} source`;
   }
}

function selectRelevantSources(
   topic: string,
   maxSources: number,
): Array<{ domain: string; type: string }> {
   const topicSources = AUTHORITATIVE_SOURCES[topic] || [];
   const generalSources = AUTHORITATIVE_SOURCES.general || [];
   const researchSources = AUTHORITATIVE_SOURCES.research || [];

   // Combine relevant sources
   const combined = [...topicSources, ...researchSources, ...generalSources];

   // Remove duplicates and limit
   const seen = new Set<string>();
   return combined
      .filter((source) => {
         if (seen.has(source.domain)) return false;
         seen.add(source.domain);
         return true;
      })
      .slice(0, maxSources);
}

export const addExternalLinksTool = createTool({
   id: "addExternalLinks",
   description:
      "Identify locations for external links and suggest authoritative sources.",
   inputSchema: AddExternalLinksInputSchema,
   outputSchema: AddExternalLinksOutputSchema,
   execute: async (input) => {
      const { content, topic, keywords, maxLinks } = input;

      const detectedTopic = detectTopic(content, topic);

      // Find citation opportunities
      const opportunities = findCitationOpportunities(content);

      // Select relevant authoritative sources
      const sources = selectRelevantSources(detectedTopic, maxLinks || 3);

      const linksAdded: z.infer<
         typeof AddExternalLinksOutputSchema
      >["linksAdded"] = [];
      const suggestions: z.infer<
         typeof AddExternalLinksOutputSchema
      >["suggestions"] = [];
      const modifiedContent = content;

      // Generate suggestions for each opportunity
      for (let i = 0; i < Math.min(opportunities.length, maxLinks || 3); i++) {
         const opp = opportunities[i];
         const source = sources[i % sources.length];

         if (opp && source) {
            suggestions.push({
               domain: source.domain,
               reason: `Add ${source.type} citation for "${opp.text}" at line ${opp.lineNumber}`,
               searchQuery: generateSearchQuery(opp.text, topic, opp.type),
            });
         }
      }

      // Add source suggestions for remaining authoritative domains
      for (const source of sources.slice(suggestions.length)) {
         suggestions.push({
            domain: source.domain,
            reason: `${source.type} - authoritative source for ${topic}`,
            searchQuery: `site:${source.domain} ${topic} ${keywords[0] || ""}`,
         });
      }

      // Note: We don't actually insert links here since we don't have real URLs
      // The tool provides suggestions for manual implementation
      // In a real implementation, you might integrate with a link verification service

      return {
         success: suggestions.length > 0,
         modifiedContent, // Unchanged - suggestions only
         linksAdded,
         suggestions: suggestions.slice(0, maxLinks || 3),
      };
   },
});
