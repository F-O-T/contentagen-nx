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
   return `You are a creative content strategist for a brand. Generate ten unique and engaging blog post headlines based on the provided context, web search findings, and target keywords. Each headline should be highly creative, relevant to the brand, and represent a different angle or topic.

**HEADLINE GENERATION REQUIREMENTS:**
- Create exactly ten unique blog post headlines.
- Each headline must be catchy, attention-grabbing, and suitable for attracting readers.
- Ensure headlines are highly creative and not generic or common topics.
- Make sure all headlines are relevant to the brand's values, products, or services.
- Incorporate the provided keywords naturally into the headlines where appropriate.
- Reflect current online trends and content marketing best practices.
- Ensure diversity in topics, angles, and approaches across all ten headlines.
- Focus on headlines that would genuinely interest and engage the target audience.
- Each headline should be concise (typically 6-12 words) and compelling.

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON in the specified format.
- The JSON object must contain a single key: 'ideas'.
- The value associated with 'ideas' must be an array of strings.
- Each string in the array should be a single blog post headline.
- Do NOT include any text outside the JSON structure.
- Ensure the headlines are creative, specific, and tailored to the brand, avoiding generic statements.
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
---BRAND_CONTEXT_START---
${brandContext}
---BRAND_CONTEXT_END---

---WEB_SEARCH_FINDINGS_START---
${webSnippets}
---WEB_SEARCH_FINDINGS_END---

---TARGET_KEYWORDS_START---
${keywords.join(", ")}
---TARGET_KEYWORDS_END---
`;
}
