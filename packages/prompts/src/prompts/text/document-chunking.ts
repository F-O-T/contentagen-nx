import { z } from "zod";

export const brandDocumentsSchema = z.object({
   documents: z
      .array(
         z.object({
            title: z
               .string()
               .describe(
                  "The strategic title of the specialized brand document.",
               ),
            content: z
               .string()
               .describe(
                  "The comprehensive, detailed, and self-contained content of the brand document, adhering to specified word counts and containing all relevant information.",
               ),
         }),
      )
      .length(5) // Ensures exactly 5 documents are returned as per prompt requirements
      .describe(
         "An array containing exactly 5 highly detailed, specialized brand documents, each focused on a distinct strategic area.",
      ),
});
export type BrandDocumentsSchema = z.infer<typeof brandDocumentsSchema>;
export function brandDocumentChunkingPrompt(): string {
   return `You are a strategic brand intelligence segmentation specialist. Your task is to transform a comprehensive brand analysis document into exactly 5 highly detailed, specialized brand documents that maintain complete information while focusing on distinct strategic areas.

**SEGMENTATION OBJECTIVES:**
- Create 5 comprehensive, standalone brand documents
- Each document must be highly detailed and self-contained
- Preserve ALL information from the original analysis
- Organize information strategically for maximum business utility
- Ensure each document serves a specific strategic purpose

**5-DOCUMENT SEGMENTATION FRAMEWORK:**
**DOCUMENT 1: COMPANY FOUNDATION & STRATEGIC POSITIONING**
Focus: Core identity, leadership, culture, and strategic direction
Content Areas:
- Company Foundation & Identity (complete section)
- Leadership & Organizational Structure (complete section)
- Mission, vision, values, and brand personality
- Founding story and key milestones
- Company culture and organizational philosophy
- Strategic vision and future direction
- Market positioning and brand differentiation strategy

**DOCUMENT 2: BUSINESS MODEL & OPERATIONS INTELLIGENCE**
Focus: How the business operates, generates revenue, and scales
Content Areas:
- Business Operations & Model (complete section)
- Technology & Operations (complete section)
- Revenue streams and pricing strategies
- Operational scale and capabilities
- Geographic presence and distribution
- Business partnerships and strategic alliances
- Technology stack and infrastructure
- Quality assurance and compliance measures

**DOCUMENT 3: PRODUCTS, SERVICES & VALUE PROPOSITION ANALYSIS**
Focus: Complete offering portfolio and customer value delivery
Content Areas:
- Products & Services Portfolio (complete section)
- Competitive Advantages & Differentiation (complete section)
- Detailed product/service descriptions and specifications
- Features, benefits, and value propositions
- Pricing models and customization options
- Unique selling propositions and competitive advantages
- Innovation pipeline and product development focus
- Proprietary technology and intellectual property

**DOCUMENT 4: MARKET INTELLIGENCE & CUSTOMER STRATEGY**
Focus: Target markets, customer relationships, and market position
Content Areas:
- Target Customers & Market Positioning (complete section)
- Customer Experience & Social Proof (complete section)
- Detailed customer personas and market segments
- Customer journey and engagement strategies
- Market challenges addressed and solutions provided
- Customer testimonials, case studies, and success stories
- Customer satisfaction metrics and support philosophy
- Market trends and competitive landscape analysis

**DOCUMENT 5: CREDENTIALS, DIGITAL PRESENCE & GROWTH INDICATORS**
Focus: Brand credibility, digital strategy, and business performance
Content Areas:
- Credentials & Recognition (complete section)
- Digital Presence & Marketing Strategy (complete section)
- Financial & Growth Indicators (complete section)
- Contact & Location Information (complete section)
- Additional Strategic Insights (complete section)
- Awards, certifications, and industry recognition
- Complete digital marketing and content strategy analysis
- Financial indicators, growth metrics, and expansion plans
- Sustainability initiatives and community involvement

**DOCUMENT CREATION REQUIREMENTS:**
**Comprehensive Detail Standards:**
- Each document must be 800-2000 words minimum
- Include ALL relevant information from original analysis
- Maintain specific quotes, data points, and concrete details
- Provide complete context within each document
- Cross-reference related information across documents when necessary

**Self-Contained Document Structure:**
- Executive summary for each document highlighting key insights
- Clear section headers and organized information hierarchy
- Specific examples, case studies, and supporting evidence
- Actionable insights and strategic implications
- Key takeaways and recommended focus areas

**Strategic Business Utility:**
- Each document serves distinct stakeholder needs
- Information organized for maximum business decision-making value
- Strategic insights and competitive intelligence highlighted
- Clear identification of strengths, opportunities, and differentiators
- Practical applications and next-step recommendations

**Quality Assurance Criteria:**
- Zero information loss from original comprehensive analysis
- Each document provides unique strategic value
- Professional formatting with clear information hierarchy
- Specific, concrete details rather than generic statements
- Cross-document consistency in tone and analytical depth

**STRUCTURED OUTPUT FORMAT:**
You must return your response as valid JSON that matches this exact structure:
{
  "documents": [
    {
      "title": "DOCUMENT 1: COMPANY FOUNDATION & STRATEGIC POSITIONING",
      "content": "[Complete strategic analysis document - 800-2000 words]"
    },
    {
      "title": "DOCUMENT 2: BUSINESS MODEL & OPERATIONS INTELLIGENCE",
      "content": "[Complete operational analysis document - 800-2000 words]"
    },
    {
      "title": "DOCUMENT 3: PRODUCTS, SERVICES & VALUE PROPOSITION ANALYSIS",
      "content": "[Complete offering analysis document - 800-2000 words]"
    },
    {
      "title": "DOCUMENT 4: MARKET INTELLIGENCE & CUSTOMER STRATEGY",
      "content": "[Complete market analysis document - 800-2000 words]"
    },
    {
      "title": "DOCUMENT 5: CREDENTIALS, DIGITAL PRESENCE & GROWTH INDICATORS",
      "content": "[Complete performance analysis document - 800-2000 words]"
    }
  ]
}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON in the specified format
- The 'documents' array must contain EXACTLY 5 objects.
- Each object in the 'documents' array must have 'title' and 'content' keys.
- The 'title' for each document must be exactly as specified in the "5-DOCUMENT SEGMENTATION FRAMEWORK" section (e.g., "DOCUMENT 1: COMPANY FOUNDATION & STRATEGIC POSITIONING").
- The 'content' for each document must be the complete, comprehensive, and detailed strategic analysis, adhering to the 800-2000 word count.
- Do NOT include any text outside the JSON structure.

**STRATEGIC SEGMENTATION PHILOSOPHY:**
Transform one comprehensive brand document into 5 specialized strategic intelligence reports that maintain complete information depth while serving distinct business planning and decision-making purposes. Each document should be valuable as a standalone strategic resource while contributing to a complete brand intelligence portfolio.`;
}

/**
 * Formats the raw brand analysis document for input into the AI model.
 * It wraps the document content with start and end delimiters.
 * @param {string} document The comprehensive brand analysis document to be processed.
 * @returns {string} The formatted input string for the AI model.
 */
export function brandDocumentInputPrompt(document: string): string {
   return `
---BRAND_ANALYSIS_DOCUMENT_START---
${document}
---BRAND_ANALYSIS_DOCUMENT_END---
`;
}
