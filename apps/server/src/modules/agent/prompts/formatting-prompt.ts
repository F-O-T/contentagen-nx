import type { AgentSelect } from "@api/schemas/agent-schema";

export function getFormattingStyleSection(
   style: AgentSelect["formattingStyle"],
): string {
   switch (style) {
      case "structured":
         return `## Formatting Style: Clear Structure

**Organization Framework**:
- Use descriptive, keyword-rich headings (H2, H3)
- Implement logical information hierarchy
- Create scannable content with strategic white space
- Use bullet points for lists and key benefits
- Include summary boxes or key takeaway sections
- Employ consistent formatting patterns throughout

**Visual Hierarchy**:
- Introduction with clear purpose and preview
- Main sections with 2-4 supporting subsections each
- Conclusion with actionable next steps
- Use bold text sparingly for emphasis on key points
- Include transition sentences between major sections`;

      case "narrative":
         return `## Formatting Style: Story Flow

**Narrative Structure**:
- Create compelling opening that establishes stakes
- Develop logical story progression with clear transitions
- Use case studies, examples, or scenarios as narrative vehicles
- Build tension through problem/solution dynamics
- Include character development (user personas, customer stories)
- Maintain reader engagement through strategic pacing

**Story Elements**:
- Setup: Establish context and relevance
- Conflict: Present challenges or problems
- Resolution: Provide solutions and outcomes
- Conclusion: Tie themes together with clear takeaways`;

      case "list_based":
         return `## Formatting Style: Scannable Lists

**List Organization**:
- Prioritize information by importance or sequence
- Use parallel structure for all list items
- Include brief explanations (1-2 sentences) for each point
- Group related items under themed subsections
- Use action-oriented language in list items
- Employ nested lists for complex information hierarchies

**List Variety**:
- Numbered lists for processes and sequential steps
- Bullet points for features, benefits, and options
- Checkboxes for actionable items and requirements
- Comparison formats for alternatives and choices`;

      default:
         return `## Formatting Style: Appropriate Format\nOrganize content in the most effective way for the topic and audience.`;
   }
}

export function knowledgeFormatterPrompt(): string {
   return `Transform these KnowledgePoints into structured JSON objects. Each object needs:

REQUIRED FIELDS:
- content: The full synthesis text
- summary: The core insight
- category: One of 'brand_guideline', 'product_spec', 'market_insight', 'technical_instruction', or 'custom'
- keywords: 3-5 specific, actionable terms (avoid generic words)
- source: The source type provided
- confidence: Float 0-1 indicating extraction quality

STRICT REQUIREMENTS:
- Output ONLY a JSON array: [{ ... }, { ... }]
- No markdown, no explanations, no code fences
- Valid JSON parseable by JSON.parse()
- Even single items must be in an array

QUALITY FILTERS:
- Exclude generic or trivial content
- Ensure keywords are specific and valuable
`;
}
