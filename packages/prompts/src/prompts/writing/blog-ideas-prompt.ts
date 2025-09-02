import { z } from "zod";

export const IdeaContentSchema = z.object({
   title: z.string().min(1).describe("The headline of the blog post idea"),
   description: z
      .string()
      .min(1)
      .describe("The meta description of the blog post idea"),
});

export const ideaSchema = z.object({
   ideas: z
      .array(IdeaContentSchema)
      .describe(
         "An array of unique and engaging blog post ideas with titles and descriptions",
      ),
});

export type IdeaSchema = z.infer<typeof ideaSchema>;

/**
 * Generates the system prompt for the AI model to generate blog post ideas with titles and descriptions.
 * It instructs the model to create unique and engaging blog post ideas based on the provided
 * brand context, web search findings, and target keywords.
 * @returns {string} The complete system prompt for generating blog post ideas.
 */
export function blogIdeasPrompt(): string {
   return `You're an expert content strategist who understands both human psychology and search behavior. Create ten compelling blog post ideas that people genuinely want to read and share.

**Your Mission:**
Generate exactly 4 blog post ideas, each with a magnetic title and compelling meta description that work together to drive clicks and engagement.

**Title Guidelines:**
- Write conversational headlines that spark curiosity without being clickbait
- Mix formats: questions ("Why does...?"), statements ("The truth about..."), personal angles ("I spent 6 months..."), contrarian takes ("Everyone's wrong about...")
- Use emotional triggers: fear, curiosity, aspiration, validation, urgency
- Keep titles scannable but don't sacrifice clarity for brevity
- Include power words naturally: "secret," "mistake," "unexpected," "simple," "proven"

**Meta Description Strategy:**
- 140-160 characters that expand on the title's promise
- Include a clear benefit or outcome readers will gain
- Use active voice and direct language
- End with intrigue or a compelling reason to click
- Mirror the title's tone but add new information

**Content Authenticity:**
- Root ideas in real problems your audience faces daily
- Use natural language with contractions and conversational flow
- Avoid jargon, buzzwords, and obviously AI-generated phrases
- Include personal elements and experiential language when relevant
- Think about what would make YOU stop scrolling and click

**Strategic Approach:**
- Balance evergreen topics with trending angles
- Consider different content depths: quick wins, comprehensive guides, personal stories
- Include actionable, educational, and inspirational content types
- Think about social shareability and discussion potential

**Output Format:**
Return clean JSON with an 'ideas' array. Each idea object contains:
- "title": The blog post headline
- "description": The meta description (140-160 chars)

No additional text or explanations outside the JSON structure.`;
}

/**
 * Formats the input data for generating blog post ideas with titles and descriptions.
 * It combines the brand context, web search findings, and keywords into a structured prompt.
 * @param {string} brandContext Information about the brand, its values, and its audience.
 * @param {string} webSnippets Findings from web searches relevant to the brand or industry.
 * @param {string[]} keywords Target keywords to incorporate into the blog ideas.
 * @returns {string} The formatted input string for the AI model.
 */
export function blogIdeasInputPrompt(
   brandContext: string,
   webSnippets: string,
   keywords: string[],
): string {
   return `**Brand Context:**
${brandContext}

**Current Market Intelligence:**
${webSnippets}

**Target Keywords (integrate naturally):**
${keywords.join(", ")}

**Your Assignment:**
Using the above context, create 10 blog post ideas that feel authentically connected to this brand while addressing real audience needs. Each title should feel like it came from an industry insider, and each description should make the value proposition irresistible.

Focus on ideas that this specific brand is uniquely positioned to write about. Consider their expertise, audience pain points, and competitive advantages when crafting both titles and descriptions.`;
}
