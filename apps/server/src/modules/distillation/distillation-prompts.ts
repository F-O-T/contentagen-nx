// Prompt builders for the distillation module

export const DISTILL_CONFIG = {
   MODEL: "google/gemini-2.0-flash-001",
   MAX_TEXT_LENGTH: 50000,
   MIN_CONTENT_LENGTH: 50,
   MAX_CHUNKS_PER_BATCH: 10,
   EMBEDDING_BATCH_SIZE: 5,
   RETRY_ATTEMPTS: 3,
   RETRY_DELAY: 1000,
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

export function buildFormattingPrompt(): string {
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
