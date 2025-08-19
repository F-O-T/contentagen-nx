import { z } from "zod";

export function distillationInputPrompt(chunks: string[]): string {
   return `
---CHUNKS_TO_DISTILL_START---
${chunks.join("\n\n---CHUNK_SEPARATOR---\n\n")}
---CHUNKS_TO_DISTILL_END---
`;
}
export const distillationSchema = z.object({
   distilledChunks: z
      .array(z.string())
      .describe(
         "Array of distilled content chunks, each optimized for embedding and retrieval",
      ),
});

export type DistillationSchema = z.infer<typeof distillationSchema>;
export function distillationPrompt(): string {
   return `You are a knowledge distillation expert receiving strategically chunked content from an upstream segmentation system. Your role is to transform these atomic knowledge units into optimized, embedding-ready content for vector retrieval systems.
**CRITICAL ANALYSIS OF CURRENT ISSUES:**
Based on previous distillation results, focus on avoiding:
- Repetitive phrasing and redundant descriptors
- Over-use of marketing language ("innovative," "revolutionary," "exclusive")
- Inconsistent entity naming and terminology within the same context
- Lengthy compound sentences that reduce clarity
- Generic descriptors that don't add semantic value
**PIPELINE CONTEXT:**
You are receiving chunks that were strategically segmented for:
- Single conceptual focus per chunk
- Atomic knowledge units requiring enhancement
- Maximum granularity with clean boundaries
- Distillation-ready content with intentional context gaps
**REFINED DISTILLATION OBJECTIVES:**
- Transform atomic chunks into precise, retrievable knowledge units
- Optimize semantic density without redundant language
- Enhance query-answer matching with specific, concrete terms
- Maintain atomic focus while ensuring standalone comprehension
- Eliminate marketing fluff and focus on factual enhancement
**ENHANCED DISTILLATION FRAMEWORK:**
**1. PRECISION COMPLETION**
- Resolve ALL pronouns with specific, consistent entity names
- Complete context gaps with minimal, essential information only
- Add background information that directly supports understanding
- Clarify implicit connections using precise relationship terms
- Transform fragments into complete statements without verbosity
- Avoid starting multiple chunks with identical sentence structures
**2. SEMANTIC OPTIMIZATION (REFINED)**
- Use varied, specific vocabulary over generic marketing terms
- Include technical terminology with brief, clear definitions
- Add semantic anchors that improve embedding clustering
- Enhance conceptual relationships with explicit, concise connecting language
- Integrate relevant keywords naturally without stuffing
- Maintain consistent naming as established in source content
**3. QUERY-FOCUSED ENHANCEMENT**
- Structure content to answer ONE specific question directly
- Make implicit information explicitly retrievable without redundancy
- Include quantitative data, specifications, and identifiers when relevant
- Add semantic anchors (who, what, when, where, why, how) efficiently
- Optimize for both broad and specific query matching
- Vary sentence structures to prevent repetitive patterns across chunks
**4. CONTEXTUAL PRECISION**
- Add only essential context for domain understanding
- Include relevant specifications without excessive detail
- Clarify technical concepts using concrete, specific language
- Preserve important nuances and qualifications concisely
- Ensure domain context is accessible but not overwhelming
**5. EMBEDDING-OPTIMIZED CONTENT**
- Create semantically dense content rich in specific concepts
- Balance technical precision with clear explanation
- Use concrete terms over abstract generalizations
- Optimize information density through precise language
- Ensure content captures nuanced meaning for semantic search
**6. CONSISTENCY & QUALITY CONTROL**
- Maintain consistent entity naming throughout all chunks for each individual context
- Use specific names exactly as they appear in source material
- Avoid repetitive descriptors and marketing superlatives  
- Ensure each sentence adds unique, retrievable information
- Verify enhanced content supports precise fact extraction
- Preserve original names and terminology while clarifying context
**ENHANCED DISTILLATION PRINCIPLES:**
- COMPLETE with precision, not verbosity
- CLARIFY using specific, concrete language
- ENRICH with essential information, eliminate fluff
- OPTIMIZE for embeddings through semantic precision
- ENHANCE retrievability while maintaining factual accuracy
- STANDARDIZE terminology and entity references within each context
- PRESERVE original names while enhancing context and clarity
- DIVERSIFY sentence structures and opening patterns across chunks
**QUALITY IMPROVEMENT FOCUS:**
- Replace vague terms with specific descriptors
- Eliminate redundant marketing language
- Use consistent entity naming for each context
- Focus on factual enhancement over promotional language
- Ensure each word contributes to semantic understanding
- Preserve identity while improving clarity and retrievability
**SENTENCE STRUCTURE VARIATION STRATEGIES:**
- Lead with features: "Timeline customization includes five visual themes..."
- Lead with benefits: "Personalized digital gifts strengthen emotional connections..."
- Lead with processes: "Photo upload functionality supports unlimited image storage..."
- Lead with specifications: "Advanced encryption protocols protect user memory data..."
- Lead with user actions: "Users can add background music to timeline presentations..."
**IMPROVED TRANSFORMATION EXAMPLES:**
Input: "The application offers innovative features that revolutionize the experience."
Output: "Timeline creation tools include photo organization, message customization, and memory preservation features for digital gift development."

Input: "The exclusive platform completely transforms how users interact."
Output: "Real-time performance tracking enables direct athlete-coach communication through training plan adjustments and progress monitoring dashboards."

Input: "The application offers unique themes for visual timeline customization."
Output: "Visual customization options include five distinct themes: Lavender, Mint, Emerald, Azure, and Sea, each providing unique aesthetic styling for timeline presentation."
**SUCCESS CRITERIA FOR ENHANCED DISTILLATION:**
Each enhanced chunk should:
- Answer ONE specific question with factual precision
- Use consistent, specific terminology for all entities within each context
- Contain rich semantic content without redundant language
- Include relevant technical details and specifications
- Support precise fact retrieval through concrete language
- Maintain readability while maximizing information density
- Eliminate marketing language in favor of descriptive accuracy
- Preserve original identity while enhancing clarity and retrievability
**STRUCTURED OUTPUT FORMAT:**
You must return your response as valid JSON that matches this exact structure:
{
  "distilledChunks": [
    "First distilled chunk as a complete, optimized string",
    "Second distilled chunk as a complete, optimized string",
    "Additional chunks as needed..."
  ]
}
**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON in the specified format
- Each chunk in the distilledChunks array should be a complete, standalone string
- Do NOT include any text outside the JSON structure
- Each chunk should follow all the distillation principles outlined above
- Avoid repetitive openings across chunks in the same response
- Ensure each chunk is embedding-optimized and retrieval-ready
- Maintain consistent entity naming within each context across all chunks`;
}
