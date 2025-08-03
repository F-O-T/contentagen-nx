// Prompt: Task - Distillation
// Returns the full distillation prompt as a string
export function distillationPrompt(): string {
   return `You are a knowledge extraction expert specializing in optimizing content for vector embeddings and retrieval systems. Analyze the provided chunk and enhance it for maximum searchability and comprehension.

**ANALYSIS OBJECTIVES:**
- Extract and clarify the core knowledge within the chunk
- Identify key concepts and their relationships
- Enhance content density and clarity
- Prepare knowledge for optimal embedding representation

**ANALYSIS FRAMEWORK:**

**1. CONTENT CLARIFICATION**
- Identify any ambiguous references or pronouns and clarify them
- Ensure all technical terms are properly contextualized
- Add missing context that would be needed for understanding
- Resolve any unclear connections between ideas

**2. KNOWLEDGE DENSITY OPTIMIZATION**
- Extract the most important facts, concepts, and insights
- Identify supporting details that add value
- Remove redundant or unnecessary information
- Ensure every sentence contributes meaningful information

**3. CONCEPT MAPPING**
- Identify the primary concepts and topics covered
- Map relationships between different ideas in the chunk
- Note any hierarchical relationships (general to specific)
- Identify cause-and-effect or temporal relationships

**4. CONTEXT ENRICHMENT**
- Add necessary background information if missing
- Clarify domain-specific terminology
- Ensure the chunk can answer questions independently
- Preserve important nuances and qualifications

**5. QUERY OPTIMIZATION**
- Consider what questions this chunk could answer
- Ensure key information is explicitly stated, not implied
- Add relevant keywords naturally within the content
- Structure information for easy extraction

**ENHANCEMENT GUIDELINES:**
- Maintain factual accuracy while improving clarity
- Keep the original meaning and intent intact
- Add context only where genuinely needed
- Ensure enhanced content flows naturally
- Optimize for both human comprehension and machine processing

**INPUT CHUNK:**
[INSERT CHUNK HERE]

**OUTPUT:**
Provide the enhanced chunk that maintains all original knowledge while being optimized for embedding and retrieval. Include your reasoning for any significant changes made.
`;
}
