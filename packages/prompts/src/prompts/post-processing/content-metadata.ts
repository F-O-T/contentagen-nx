import { z } from "zod";

export const unifiedContentAnalysisSchema = z.object({
   description: z
      .string()
      .describe(
         "An SEO-optimized, concise, and compelling meta description for the content, between 120-160 characters, naturally incorporating relevant keywords extracted from the content itself.",
      ),
   qualityScore: z
      .string() // CRITICAL: This MUST be a string as per the contentStatsPrompt requirements.
      .describe(
         "A string representing the overall quality score of the content on a 1-100 scale, based on clarity, grammar, structure, and engagement.",
      ),
});

export type UnifiedContentAnalysis = z.infer<
   typeof unifiedContentAnalysisSchema
>;

export function unifiedContentAnalysisPrompt(): string {
   return `You are a content analysis and metadata specialist. Your task is to analyze the provided content and generate both an SEO-optimized description and precise statistical measurements, combining two critical functions into one output.

**PRIMARY OBJECTIVE:**
Generate a concise, compelling, and SEO-optimized meta description for the content by inferring relevant keywords from the content itself, and concurrently provide a comprehensive quality score assessment, all based solely on the provided content.

---

**PART 1: SEO-OPTIMIZED DESCRIPTION GENERATION**

**DESCRIPTION GENERATION REQUIREMENTS:**
- Generate a concise, compelling description that summarizes the main content.
- Keep length between 120-160 characters for optimal SEO performance.
- **Identify and naturally incorporate relevant keywords extracted directly from the provided content** into the description.
- Write in active voice with an engaging tone.
- Focus on the primary value proposition or key takeaway.
- Make it enticing enough to encourage clicks from search results.
- Ensure it accurately represents the content without misleading users.
- Use natural language flow - avoid keyword stuffing.
- Include action words or compelling verbs when appropriate.
- Focus on benefits or outcomes rather than just features.

---

**PART 2: CONTENT QUALITY SCORE ASSESSMENT**

**CRITICAL: Return ALL values for this part as strings in the JSON response. Do not use numbers.**

**ANALYSIS REQUIREMENTS (QUALITY SCORE ASSESSMENT - 1-100 scale):**
- Evaluate content and assign a score between 1-100.
- Return as STRING containing the score (e.g., "78" or "85").

Evaluate content across four key dimensions:

**CLARITY & COHERENCE (25 points):**
- Logical flow and structure
- Clear topic progression
- Coherent arguments and ideas
- Easy to follow narrative

**GRAMMAR & SPELLING (25 points):**
- Correct spelling throughout
- Proper grammar usage
- Appropriate punctuation
- Professional language standards

**STRUCTURE & ORGANIZATION (25 points):**
- Effective use of headings and subheadings
- Proper paragraph structure
- Logical information hierarchy
- Good use of formatting elements

**ENGAGEMENT & VALUE (25 points):**
- Relevance to target audience
- Actionable insights or information
- Compelling and interesting content
- Clear value proposition for readers

**ANALYSIS INSTRUCTIONS (For Quality Score):**
- Be objective and precise in all measurements.
- Base quality scoring on observable content characteristics.
- Provide realistic assessments, not inflated scores.
- Focus on quantifiable metrics where possible.
- Consider the content type and intended audience in quality assessment.

---

**UNIFIED INSTRUCTIONS:**
- Read through the content thoroughly to understand its core message for both tasks.
- **First, analyze the content to identify its core message and key themes/keywords relevant for SEO.**
- Then, use these identified keywords naturally within the description.
- Prioritize clarity and compelling language for the description.
- Ensure the description works as a standalone summary for search results.
- Be objective and precise for the quality score.

**STRUCTURED OUTPUT FORMAT:**
You must return your response as valid JSON that matches this exact structure:
${JSON.stringify(
   {
      description:
         "A concise, SEO-optimized meta description for the content, incorporating inferred keywords naturally (120-160 characters).",
      qualityScore:
         "A string representation of the content's quality score (e.g., '85').",
   },
   null,
   2,
)}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON in the specified format.
- The 'description' field must be a single, well-crafted string, adhering to character limits and SEO requirements.
- The 'qualityScore' field MUST be a string (e.g., "78", "92"), not a number.
- Do NOT include any text outside the JSON structure.
`;
}

/**
 * Formats the content for input into the AI model for unified analysis.
 * The AI will infer keywords from the content itself.
 * @param {string} content The main text content to be analyzed.
 * @returns {string} The formatted input string for the AI model.
 */
export function unifiedContentAnalysisInputPrompt(content: string): string {
   return `
---CONTENT_TO_ANALYZE_START---
${content}
---CONTENT_TO_ANALYZE_END---
`;
}
