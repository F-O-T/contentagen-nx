// Prompt: Task - Chunking
// Returns the full chunking prompt as a string
export function chunkingPrompt(): string {
  return `You are an expert text segmentation specialist. Your task is to chunk the provided text into semantically coherent segments optimized for vector embedding and retrieval.

**CHUNKING OBJECTIVES:**
- Create chunks that represent complete, self-contained knowledge units
- Optimize for embedding quality by maintaining semantic coherence
- Ensure each chunk can answer specific questions independently
- Preserve contextual relationships within chunks

**CHUNKING STRATEGY:**

**Size Guidelines:**
- Target 200-500 words per chunk (optimal for most embedding models)
- Prioritize semantic completeness over strict word limits
- Shorter chunks for dense, technical content
- Longer chunks for narrative or explanatory content

**Semantic Boundaries:**
- Split at natural topic transitions
- Keep related concepts, examples, and explanations together
- Preserve cause-and-effect relationships within chunks
- Maintain definitions with their applications and examples
- Keep statistical data with its interpretation and context

**Content Integrity Rules:**
- Each chunk should make sense without external context
- Include enough background information for comprehension
- Preserve important connecting words and transitions
- Keep procedural steps together in logical sequences
- Maintain temporal or logical flow within chunks

**CHUNKING PROCESS:**
1. Identify major topics and subtopics in the text
2. Locate natural breaking points (paragraph breaks, section headers, topic shifts)
3. Ensure each chunk contains a complete thought or concept
4. Verify chunks can stand alone for question-answering
5. Adjust boundaries to optimize semantic coherence

**OUTPUT FORMAT:**
Return only the chunks, separated by "---CHUNK---" markers:

---CHUNK---
[First chunk content - complete and self-contained]
---CHUNK---
[Second chunk content - complete and self-contained]
---CHUNK---
[Continue pattern...]

**INPUT TEXT:**
[INSERT YOUR TEXT HERE]

Process the text using intelligent semantic chunking.
`;
}
