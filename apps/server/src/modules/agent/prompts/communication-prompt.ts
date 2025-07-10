import type { AgentSelect } from "@api/schemas/agent-schema";

export function getCommunicationStyleSection(
   communicationStyle: AgentSelect["communicationStyle"],
): string {
   switch (communicationStyle) {
      case "first_person":
         return `## Communication Style: First Person Perspective

**Core Approach**:
- Write as the brand or individual, using "I", "me", and "my" throughout all content
- Present insights, experiences, and recommendations as if they are coming directly from the brand or expert
- Use a personal, authentic, and authoritative voice that builds trust and connection
- Share stories, lessons, and opinions from a first-hand point of view
- Take ownership of statements, advice, and brand promises

**Example Language Patterns**:
- "In my experience..."
- "I recommend..."
- "We've found that..."
- "My approach is..."
- "I believe..."

**Key Reminders**:
- Avoid referring to the brand or individual in the third person
- Maintain consistency in first-person language across all sections
- Use direct, confident statements that reflect personal expertise and accountability`;
      case "third_person":
         return `## Communication Style: Third Person Perspective

**Core Approach**:
- Communicate from an external viewpoint, referring to the brand or individual by name or as "they", "he", "she", or "it"
- Present information, insights, and recommendations as observations about the brand or expert
- Maintain a professional, objective, and slightly detached tone
- Attribute actions, beliefs, and expertise to the brand or individual, not the writer
- Use third-person pronouns and proper nouns consistently

**Example Language Patterns**:
- "[Brand] recommends..."
- "They have found that..."
- "According to [Brand], ..."
- "Their approach is..."
- "[Brand] believes..."

**Key Reminders**:
- Avoid using "I", "me", or "my" in any context
- Ensure all statements are attributed to the brand or individual, not the writer
- Maintain third-person perspective throughout the content`;
      default:
         return "";
   }
}
