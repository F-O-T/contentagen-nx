// Prompt: Task - Formatting
// Returns the full formatting prompt as a string
export function formattingPrompt(): string {
   return `

**Instructions:**
- Output only the distilled brand metadata as a plain string in natural language.
- Do not include any JSON, code blocks, or extra formatting.
- Do not include any explanations or additional text—just the distilled knowledge.
`;
}
