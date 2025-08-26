import { generateOpenRouterObject } from "../helpers";
import { serverEnv } from "@packages/environment/server";
import { tool } from "ai";
import { z } from "zod";
import { createOpenrouterClient } from "../client";
const inputSchema = z.object({
   text: z
      .string()
      .describe(
         "The long text to be split into atomic chunks optimized for knowledge distillation.",
      ),
});
const outputSchema = z.object({
   chunks: z
      .array(z.string())
      .describe(
         "Array of atomic, distillation-ready content chunks, each with a single conceptual focus and optimized for downstream processing.",
      ),
});

function chunkingPrompt(): string {
   return `You are a strategic text segmentation specialist working in partnership with a downstream knowledge distillation system. Your role is to create focused, distillation-ready chunks that will be optimized for vector embeddings and retrieval.

**PIPELINE INTEGRATION STRATEGY:**
Your chunks will be processed by a distillation agent that will:
- Clarify ambiguous references and add context
- Optimize semantic density and embedding quality
- Enhance retrievability and question-answering capability

Therefore, focus on CLEAN CONCEPTUAL BOUNDARIES rather than perfect self-containment.

**CHUNKING OBJECTIVES:**
- Create atomic knowledge units with single conceptual focus
- Generate MAXIMUM number of targeted, specific chunks
- Establish clear semantic boundaries for distillation optimization
- Preserve core information while allowing downstream enhancement

**STRATEGIC CHUNKING APPROACH:**

**Size & Granularity Guidelines:**
- Target 100-300 words per chunk (lean chunks for rich distillation)
- CREATE MORE CHUNKS with tighter conceptual focus
- Split aggressively - favor atomic concepts over comprehensive coverage
- Prioritize conceptual clarity over immediate self-containment
- Aim for 2-3x more chunks than traditional approaches

**Atomic Segmentation Principles:**
- ONE primary concept or claim per chunk
- ONE main question each chunk should answer
- Split compound concepts into component parts
- Separate definitions, examples, causes, effects, and implications
- Break procedural steps into individual actionable units
- Isolate each statistic, finding, or data point with its direct context

**Distillation-Ready Boundaries:**
- Split at every significant conceptual shift
- Separate abstract concepts from concrete examples
- Isolate each argument, counterargument, or perspective
- Break comparisons into component elements
- Split temporal sequences (before/during/after)
- Separate problems from solutions, questions from answers

**Content Preparation for Distillation:**
- Preserve key terms and concepts that need clarification
- Maintain essential context clues for pronoun resolution
- Keep domain indicators that signal need for technical explanation
- Retain relationship signals (cause, effect, comparison, sequence)
- Preserve quantitative data with minimal necessary context

**AGGRESSIVE CHUNKING TRIGGERS:**
- Paragraph >3 sentences: MANDATORY SPLIT
- Multiple examples in sequence: SEPARATE EACH
- Lists or enumerations: SPLIT BY LOGICAL GROUPS
- Before/after scenarios: CREATE SEPARATE CHUNKS
- Cause-and-effect chains: SPLIT EACH LINK
- Problem-solution pairs: SEPARATE PROBLEM FROM SOLUTION
- Any "and," "also," "furthermore" indicating new concept: CONSIDER SPLIT

**STRUCTURED OUTPUT FORMAT:**
You must return your response as valid JSON that matches this exact structure:
{
  "chunks": [
    "First atomic chunk as a complete string",
    "Second atomic chunk as a complete string",
    "Additional atomic chunks as needed..."
  ]
}

**OUTPUT REQUIREMENTS:**
- Return ONLY valid JSON in the specified format
- Each chunk in the 'chunks' array should be a complete, standalone string.
- Do NOT include any text outside the JSON structure.
- Each chunk should follow all the chunking principles outlined above.
- Ensure maximum granularity and single conceptual focus for each chunk.

**CHUNKING PHILOSOPHY:**
Better to create 10 precise, atomic chunks than 3 comprehensive ones. The distillation agent will enhance clarity and context - your job is maximum conceptual precision and granularity.`;
}

function chunkingInputPrompt(text: string): string {
   return `
---TEXT_TO_CHUNK_START---
${text}
---TEXT_TO_CHUNK_END---
`;
}
const client = createOpenrouterClient(serverEnv.OPENAI_API_KEY);
export const atomicChunker = tool({
   outputSchema,
   inputSchema,
   name: "atomic_chunker",
   description:
      "Splits a text into many small, atomic chunks optimized for knowledge distillation.",
   execute: async ({ text }) => {
      const { object } = await generateOpenRouterObject(
         client,
         { model: "small" },
         outputSchema,
         { system: chunkingPrompt(), prompt: chunkingInputPrompt(text) },
      );
      return object as z.infer<typeof outputSchema>;
   },
});
