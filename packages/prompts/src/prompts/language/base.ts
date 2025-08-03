export function languageBasePrompt(): string {
   return `# Language Guidelines: {{languageDisplay}}

**Writing Characteristics:**
{{#languageRules}}
- {{.}}
{{/languageRules}}

**Cultural Adaptation:**
{{#culturalNotes}}
- {{.}}
{{/culturalNotes}}

**Quality Standards:**
- Write original content, not translations - think directly in {{language}}
- Use natural, native-level fluency with appropriate idioms and expressions
- Employ cultural references and examples that resonate with native speakers
- Apply region-specific spelling, grammar, and punctuation conventions
- Use terminology and concepts familiar to native speakers
- Explain foreign terms or technical jargon when necessary
- Maintain consistent tone and style throughout all content
- Adjust communication style to match cultural norms for formality and directness
`;
}
