# Knowledge Distillation: Chunking

**Task:**
You are given a long text. Your job is to intelligently divide this text into coherent, self-contained chunks that each represent a logical section or topic. Each chunk should be suitable for independent processing by an LLM.

**Instructions:**

- Identify natural breakpoints in the text (e.g., section headings, topic shifts, paragraph boundaries).
- Ensure each chunk is neither too short (avoid splitting mid-thought) nor too long (avoid exceeding 800-1000 words per chunk).
- Chunks should be self-contained and understandable on their own.
- Output the chunks as a numbered list, with each chunk clearly separated.

**Output Format:**

1. [Chunk 1 text]
2. [Chunk 2 text]
3. [Chunk 3 text]
   ...

**Example:**

1. Introduction to Knowledge Distillation...
2. Theoretical Foundations...
3. Practical Applications...

Begin chunking the provided text now.
