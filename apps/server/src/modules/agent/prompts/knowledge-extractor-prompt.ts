// Prompt builders for the distillation module

export const DISTILL_CONFIG = {
   MAX_TEXT_LENGTH: 50000,
   MIN_CONTENT_LENGTH: 50,
} as const;
export function buildExtractionPrompt(
   rawText: string,
   sourceType: string,
): string {
   return `You are the Synthesizer Agent. Extract valuable, actionable KnowledgePoints from the provided text.

QUALITY CRITERIA:
- Each KnowledgePoint must be self-contained and meaningful
- Minimum ${DISTILL_CONFIG.MIN_CONTENT_LENGTH} characters of substantial content
- Focus on actionable insights, not generic statements
- Include context and practical implications
- Avoid redundancy between points

OUTPUT FORMAT (one per line):
1. [CONTENT]: Deep synthesis with context and implications
   [SUMMARY]: 1-2 sentence core insight

EXAMPLE:
1. When implementing authentication flows, always validate tokens on both client and server sides to prevent security vulnerabilities. Client-side validation provides immediate feedback while server-side validation ensures data integrity and prevents tampering.
   Authentication requires dual-layer token validation for optimal security and user experience.

Raw Input (${rawText.length} chars):
"""${rawText.slice(0, DISTILL_CONFIG.MAX_TEXT_LENGTH)}"""
Source: ${sourceType}
`;
}
