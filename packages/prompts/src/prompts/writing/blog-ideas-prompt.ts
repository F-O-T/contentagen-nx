import { z } from "zod";

export const ideaSchema = z.object({
   ideas: z
      .array(z.string().describe("A catchy headline for a blog post"))
      .describe("An array of unique and engaging blog post headlines"),
});

export type IdeaSchema = z.infer<typeof ideaSchema>;

/**
 * Generates the system prompt for the AI model to generate blog post headlines.
 * It instructs the model to create unique and engaging blog post headlines based on the provided
 * brand context, web search findings, and target keywords.
 * @returns {string} The complete system prompt for generating blog post headlines.
 */
export function blogIdeasPrompt(): string {
   return `Think like a seasoned content creator who's been in the trenches for years. You know what works and what doesn't. Your job is to brainstorm ten blog post headlines that feel authentic and genuinely helpful - the kind of content people actually want to read, not just click on.

**What I need from you:**
- Come up with exactly ten blog post headlines that sound natural and conversational
- Write like you're talking to a friend who asked for advice, not like you're trying to game an algorithm
- Mix up your approach - some headlines can be questions, others can be statements, maybe throw in a "how I learned" or "why everyone gets this wrong" angle
- Keep the brand's personality in mind, but don't force keywords where they don't belong
- Think about real problems people face and how this content could actually help them
- Avoid buzzwords, clickbait phrases, and anything that screams "generated content"
- Make each headline feel like it came from someone with genuine experience and insights
- Length doesn't matter as much as authenticity - some great headlines are short, others need more words to tell the story

**The human touch:**
- Include personal elements like "I tried," "Here's what happened when," or "The mistake I see everywhere"
- Use everyday language and contractions where they feel natural
- Don't be afraid of imperfection - real people don't always speak in perfectly optimized phrases
- Think about the emotional hook - what would make someone genuinely curious to read more?
- Consider seasonal relevance, current events, or timeless struggles people face

**Technical stuff:**
- Output clean JSON with an 'ideas' key containing an array of headline strings
- No extra text or explanations outside the JSON structure
- Each headline should stand alone as a complete thought
`;
}

/**
 * Formats the input data for generating blog post headlines.
 * It combines the brand context, web search findings, and keywords into a structured prompt.
 * @param {string} brandContext Information about the brand, its values, and its audience.
 * @param {string} webSnippets Findings from web searches relevant to the brand or industry.
 * @param {string[]} keywords Target keywords to incorporate into the blog headlines.
 * @returns {string} The formatted input string for the AI model.
 */
export function blogIdeasInputPrompt(
   brandContext: string,
   webSnippets: string,
   keywords: string[],
): string {
   return `
Here's what you're working with:

**About the brand:**
${brandContext}

**What's happening online right now:**
${webSnippets}

**Keywords to keep in mind (but don't force them):**
${keywords.join(", ")}

Remember: Your goal isn't to stuff keywords or check boxes. It's to create headlines that would make someone stop scrolling because they genuinely want to know more. Think like a human content creator, not a content machine.
`;
}
