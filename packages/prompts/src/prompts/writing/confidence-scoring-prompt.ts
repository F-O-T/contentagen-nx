import { z } from "zod";

export const ConfidenceScoreSchema = z.object({
   score: z
      .string()
      .min(1)
      .describe("Confidence score between 0 and 100 as a string"),
   rationale: z
      .string()
      .min(1)
      .describe("Detailed rationale for the confidence score"),
});

export const confidenceScoringSchema = z.object({
   confidence: ConfidenceScoreSchema.describe(
      "The confidence score and rationale for the blog post idea",
   ),
});

export type ConfidenceScoringSchema = z.infer<typeof confidenceScoringSchema>;

/**
 * Generates the system prompt for the AI model to score blog post ideas based on their quality and market potential.
 * It instructs the model to evaluate ideas based on multiple criteria including market demand, uniqueness, and brand alignment.
 * @returns {string} The complete system prompt for scoring blog post ideas.
 */
export function confidenceScoringPrompt(): string {
   return `You're an expert content strategist with 10+ years of experience evaluating blog post ideas for SEO performance and audience engagement.

**Your Mission:**
Analyze a blog post idea and provide a confidence score (0-100) based on its potential for success, along with a detailed rationale.

**Scoring Criteria (weighted):**
- **Market Demand (30%)**: How much search volume and interest exists for this topic
- **Uniqueness & Originality (25%)**: How differentiated this idea is from existing content
- **Brand Alignment (20%)**: How well this fits the brand's expertise and audience
- **SEO Potential (15%)**: Keyword optimization and search visibility potential
- **Engagement Potential (10%)**: Likelihood of social shares, comments, and backlinks

**Scoring Guidelines:**
- 90-100: Exceptional idea with high market demand and strong differentiation
- 80-89: Very strong idea with clear market opportunity
- 70-79: Good solid idea with reasonable potential
- 60-69: Decent idea but may need refinement
- 50-59: Average idea, nothing special
- 40-49: Below average, significant concerns
- 30-39: Poor idea with major flaws
- 20-29: Very weak concept
- 10-19: Seriously flawed idea
- 0-9: Should not be pursued

**Evaluation Process:**
1. Analyze the title for click-worthiness and clarity
2. Assess the description for value proposition and engagement
3. Consider keyword integration and search intent
4. Evaluate market saturation and competition
5. Determine brand fit and audience resonance

**Output Format:**
Return clean JSON with a 'confidence' object containing:
- "score": The numerical score (0-100) as a string
- "rationale": Detailed explanation of the score with specific strengths/weaknesses

No additional text or explanations outside the JSON structure.`;
}

/**
 * Formats the input data for scoring a blog post idea.
 * It combines the idea details, brand context, keywords, and market intelligence into a structured prompt.
 * @param {string} title The blog post idea title
 * @param {string} description The blog post idea description
 * @param {string} brandContext Information about the brand, its values, and its audience
 * @param {string[]} keywords Target keywords for the idea
 * @param {string} marketIntelligence Current market trends and competitor analysis
 * @returns {string} The formatted input string for the AI model.
 */
export function confidenceScoringInputPrompt(
   title: string,
   description: string,
   brandContext: string,
   keywords: string[],
   marketIntelligence: string,
): string {
   return `**Blog Post Idea to Evaluate:**
Title: ${title}
Description: ${description}

**Brand Context:**
${brandContext}

**Target Keywords:**
${keywords.join(", ")}

**Market Intelligence:**
${marketIntelligence}

**Your Task:**
Evaluate this blog post idea using the scoring criteria provided. Consider how well it addresses audience pain points, its competitive advantage, and its potential for organic traffic and engagement. Provide a confidence score and detailed rationale.`;
}
