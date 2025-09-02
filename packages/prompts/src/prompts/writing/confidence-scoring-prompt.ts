import { z } from "zod";

export const ConfidenceScoreSchema = z.object({
   score: z
      .string()
      .min(1)
      .describe("Confidence score between 0 and 100 as a string"),
   rationale: z
      .string()
      .min(1)
      .describe(
         "Detailed rationale for the confidence score, written in markdown format with proper headers, lists, and emphasis",
      ),
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
   return `You are an expert content strategist with 10+ years of experience evaluating blog post ideas for SEO performance, audience engagement, and business impact.

**Your Mission:**
Analyze the provided blog post idea and assign a precise confidence score (0-100) based on its potential for success. Provide a comprehensive rationale formatted in clean markdown.

**Scoring Framework (Weighted Criteria):**

1. **Market Demand & Search Volume (30%)**
   - Existing search interest and keyword difficulty
   - Trending topics and seasonal relevance
   - Problem urgency and audience pain points

2. **Content Uniqueness & Differentiation (25%)**
   - Novelty of approach or angle
   - Gap in existing content landscape
   - Unique value proposition vs competitors

3. **Brand-Audience Fit (20%)**
   - Alignment with brand expertise and authority
   - Relevance to target audience demographics
   - Consistency with brand voice and values

4. **SEO & Discoverability Potential (15%)**
   - Keyword optimization opportunities
   - Search intent alignment
   - Featured snippet and ranking potential

5. **Engagement & Virality Factors (10%)**
   - Social sharing likelihood
   - Comment and discussion potential
   - Backlink attractiveness

**Precise Scoring Scale:**

- **95-100**: Exceptional - High-impact idea with proven demand, unique angle, perfect brand fit
- **85-94**: Excellent - Strong market opportunity with clear differentiation and good execution potential
- **75-84**: Very Good - Solid idea with reasonable demand and decent competitive advantage
- **65-74**: Good - Worthwhile concept that needs some refinement or has moderate competition
- **55-64**: Average - Decent topic but lacks standout qualities or has significant competition
- **45-54**: Below Average - Weak market demand or poor differentiation, needs major improvements
- **35-44**: Poor - Serious flaws in concept, timing, or market fit
- **25-34**: Very Poor - Multiple critical issues, minimal success potential
- **15-24**: Extremely Poor - Fundamental problems with viability
- **0-14**: Reject - Should not be pursued under any circumstances

**Evaluation Methodology:**
1. **Title Analysis**: Assess click-worthiness, clarity, and search optimization
2. **Content Value Assessment**: Evaluate the description's promise and deliverables
3. **Market Position**: Research competition saturation and opportunity gaps
4. **Keyword Strategy**: Analyze target keywords for difficulty and intent match
5. **Brand Integration**: Determine authenticity and expertise demonstration
6. **Engagement Prediction**: Estimate social and community response potential

**Required Output Format:**
Return a valid JSON object with this exact structure:
{
  "confidence": {
    "score": "[numeric_score_as_string]",
    "rationale": "[detailed_markdown_analysis]"
  }
}

**Rationale Formatting Requirements:**
- Use proper markdown headers (##, ###)
- Include bullet points for criteria breakdown
- Use **bold** for key strengths and *italics* for concerns
- Add specific score contributions per criteria
- Include actionable recommendations when score < 80
- Provide concrete examples and data points when available
- **Write in perfect English**: Use proper grammar, spelling, punctuation, and professional tone
- Ensure clear, concise, and well-structured sentences throughout
- Maintain consistent voice and avoid colloquialisms or informal language

**Critical Instructions:**
- Be precise and data-driven in your scoring
- Consider current market conditions and trends
- Factor in competitive landscape realistically
- Provide specific, actionable insights
- **Write all content in perfect English** with flawless grammar, spelling, and professional tone
- Use clear, well-structured sentences and maintain consistency throughout
- No text outside the JSON structure
- Ensure markdown is properly formatted and readable`;
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

**Title:** ${title}

**Description:** ${description}

---

**Brand Context:**
${brandContext}

---

**Target Keywords:**
${keywords.map((keyword) => `- ${keyword}`).join("\n")}

---

**Market Intelligence:**
${marketIntelligence}

---

**Evaluation Task:**
Using the weighted scoring criteria, analyze this blog post idea comprehensively. Consider:
- How effectively it addresses genuine audience needs and pain points
- Its competitive positioning and differentiation opportunities
- Realistic potential for organic traffic growth and audience engagement
- Alignment with brand authority and expertise areas
- Current market timing and trend relevance

Provide your confidence score and detailed rationale following the specified format.`;
}
