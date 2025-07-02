import { Type, type Static } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import {
  agent as agentTable,
  type ContentLength,
  type InternalLinkFormat,
} from "../schemas/content-schema";
import { InvalidInputError } from "../shared/errors";

export type AgentConfig = typeof agentTable.$inferSelect;
export type AgentPromptOptions = {
  topic: string;
  description?: string | null;
  targetLength: ContentLength;
  linkFormat: InternalLinkFormat;
  includeMetaTags: boolean;
  includeMetaDescription: boolean;
};

export const AIResponseSchema = Type.Object({
  content: Type.String({ minLength: 50, maxLength: 10000 }),
  tags: Type.Optional(Type.Array(Type.String({ minLength: 1, maxLength: 50 }), { minItems: 3, maxItems: 8 })),
  metaDescription: Type.Optional(Type.String({ minLength: 1, maxLength: 160 }))
});

export type AIResponse = Static<typeof AIResponseSchema>;

export function validateAndSanitizePromptOptions(opts: unknown): AgentPromptOptions {
  if (
    typeof opts !== "object" ||
    !opts ||
    typeof (opts as any).topic !== "string" ||
    !["short", "medium", "long"].includes((opts as any).targetLength) ||
    !["mdx", "html"].includes((opts as any).linkFormat) ||
    typeof (opts as any).includeMetaTags !== "boolean" ||
    typeof (opts as any).includeMetaDescription !== "boolean"
  ) {
    throw new InvalidInputError("Invalid prompt options", "INVALID_PROMPT_OPTIONS");
  }
  const sanitized = { ...opts } as AgentPromptOptions;
  sanitized.topic = sanitizeUserInput((opts as any).topic);
  if ((opts as any).description && typeof (opts as any).description === "string") {
    sanitized.description = sanitizeUserInput((opts as any).description);
  }
  return sanitized;
}

export function validateAndSanitizeAgentConfig(config: unknown): AgentConfig {
  if (
    typeof config !== "object" ||
    !config ||
    typeof (config as any).name !== "string"
  ) {
    throw new InvalidInputError("Invalid agent config", "INVALID_AGENT_CONFIG");
  }
  const sanitized = { ...config } as AgentConfig;
  sanitized.name = sanitizeUserInput((config as any).name);
  if ((config as any).description && typeof (config as any).description === "string") {
    sanitized.description = sanitizeUserInput((config as any).description);
  }
  return sanitized;
}

function sanitizeUserInput(input: string): string {
  return input
    .trim()
    .replace(/```[\s\S]*?```/g, '[code block removed]')
    .replace(/#{3,}/g, '###')
    .replace(/\*{3,}/g, '***')
    .replace(/_{3,}/g, '___')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateAIResponse(response: unknown): AIResponse {
  if (!Value.Check(AIResponseSchema, response)) {
    const errors = [...Value.Errors(AIResponseSchema, response)]
      .map((e) => `${e.path}: ${e.message}`)
      .join("; ");
    throw new InvalidInputError(
      `Invalid AI response format: ${errors}`,
      "INVALID_AI_RESPONSE"
    );
  }
  return response;
}

function strictOutputFormatSection() {
  return `# OUTPUT FORMAT (STRICT)
You MUST respond with ONE valid, **minified JSON** object that adheres to this EXACT schema – nothing more, nothing less:

{
  "content": "string (50-10000 chars, valid Markdown only)",
  "tags": ["string1", "string2", "string3"],
  "metaDescription": "string max 160 chars"
}

NON-NEGOTIABLE RULES  
1. Property order MUST be exactly as shown above.  
2. NO extra properties are allowed.  
3. Use double quotes only; NO trailing commas.  
4. DO NOT wrap the JSON in back-ticks or markdown fences.  
5. DO NOT add explanations, commentary, or whitespace outside the object.  
6. Invalid JSON or schema mismatch = IMMEDIATE REJECTION.

`;
}

function generateTopicSection(topic: string, description?: string | null): string {
  let section = `# Content Request: ${topic}\n\n`;
  if (description && description.trim()) {
    section += `## Description\n${description.trim()}\n\n`;
  }
  return section;
}

function generateLengthSection(targetLength: ContentLength): string {
  const lengthSpecs = {
    short: { words: "100-300", description: "concise and focused" },
    medium: { words: "400-800", description: "comprehensive yet accessible" },
    long: { words: "900-1500", description: "in-depth and thorough" }
  };
  const spec = lengthSpecs[targetLength];
  return `## Content Length Requirement (STRICT)
Target word count: ${spec.words}. The article MUST be ${spec.description}.  
If the word count is outside this range, the response will be REJECTED WITHOUT REVIEW.

`;
}

function generateLinkSection(linkFormat: InternalLinkFormat): string {
  const examples = {
    html: {
      syntax: '<a href="/path/to/page">Link Text</a>',
      note: 'Use ONLY semantic HTML <a> tags for all internal links.',
      contentFormat: 'Standard HTML content structure.'
    },
    mdx: {
      syntax: '[Link Text](/path/to/page)',
      note: 'Use ONLY standard Markdown link syntax for all internal links.',
      contentFormat: 'Content MUST be formatted as complete MDX file with YAML frontmatter at the beginning.'
    }
  };
  const example = examples[linkFormat];
  return `## Internal Link Format (STRICT)
${example.note} Example: \`${example.syntax}\`
- All internal links MUST start with "/".  
- NO relative paths or external URLs for internal references.  
- Non-compliant links will trigger REJECTION.
- ${example.contentFormat}

`;
}

function generateContentStructureSection(linkFormat: InternalLinkFormat, includeMetaTags: boolean, includeMetaDescription: boolean): string {
  if (linkFormat !== 'mdx') return '';
  
  const frontmatterFields = [];
  if (includeMetaDescription) frontmatterFields.push('description: "meta description here"');
  if (includeMetaTags) frontmatterFields.push('tags: [tag1, tag2, tag3]');
  frontmatterFields.push('date: "2024-01-01"');
  
  return `## Content Structure for MDX (STRICT)
Since linkFormat is MDX, your content field MUST be formatted as a complete MDX file:

\`\`\`
---
title: "Article Title"
${frontmatterFields.join('\n')}
---

# Article Title

Your markdown content here with [internal links](/path/to/page)...
\`\`\`

CRITICAL RULES:
- Content MUST start with YAML frontmatter (--- at top and bottom)
- Title in frontmatter MUST match the main heading
- All metadata (tags, description) goes in frontmatter, NOT separate JSON fields
- Body content follows standard Markdown syntax
- Internal links use [text](/path) format only

`;
}

function generateMetaTagsSection(include: boolean): string {
  if (!include) return '';
  return `## Meta Tags Requirement (STRICT)
Include 3-8 relevant tags in the JSON response.  
- Tags MUST be lowercase, descriptive, unique, and specific.  
- Generic or duplicate tags will cause REJECTION.

`;
}

function generateMetaDescriptionSection(include: boolean): string {
  if (!include) return '';
  return `## Meta Description Requirement (STRICT)
Provide a compelling meta description ≤160 characters in the JSON response.  
- It MUST summarise the main value proposition and include primary keywords.  
- Exceeding 160 characters or omitting this field will cause REJECTION.

`;
}

function generateQualityGuidelinesSection(): string {
  return `## Quality Standards (STRICT)
- Write clear, engaging, error-free English.  
- Use active voice, varied sentence structure, actionable insights.  
- Maintain consistent, audience-appropriate tone.  
- Structure with proper headings, ordered flow, bullet lists where useful.  
- Content MUST deliver concrete value and pass plagiarism checks.  
- Failure to meet ANY quality point results in REJECTION.

`;
}

export function generateDefaultBasePrompt(agent: AgentConfig): string {
  const contentTypeLabels = {
    blog_posts: "blog posts",
    social_media: "social media content", 
    marketing_copy: "marketing copy",
    technical_docs: "technical documentation"
  };
  const audienceLabels = {
    general_public: "general public",
    professionals: "professionals",
    beginners: "beginners", 
    customers: "customers"
  };
  const styleGuidelines = {
    structured: [
      "Use clear headings and subheadings",
      "Organize content with logical flow",
      "Include bullet points and numbered lists where appropriate",
      "Maintain consistent formatting throughout"
    ],
    narrative: [
      "Focus on storytelling elements",
      "Create engaging narrative flow", 
      "Use descriptive language and examples",
      "Build emotional connection with readers"
    ],
    list_based: [
      "Prioritize scannable content with bullet points",
      "Use numbered lists for step-by-step processes",
      "Include quick takeaways and summaries",
      "Make information easily digestible"
    ]
  };
  const formattingStyleKey = agent.formattingStyle ?? "structured";
  const guidelines = styleGuidelines[formattingStyleKey].join('\n- ');
  return `# ${agent.name} - Content Creation Agent

## Agent Profile
You are ${agent.name}, an expert copywriter and content strategist specializing in ${contentTypeLabels[agent.contentType]}.

${agent.description ? `### Description\n${agent.description}\n` : ''}

## Content Guidelines

### Target Audience
Your audience: ${audienceLabels[agent.targetAudience]}.

### Voice & Tone
STRICT: Maintain a ${agent.voiceTone} tone throughout all content.
- Word choice, sentence structure, and engagement MUST reflect this tone.

### Content Structure
STRICT: Use ${agent.formattingStyle} formatting.
- ${guidelines}

## Instructions
STRICT: You MUST analyze the request, incorporate relevant knowledge, and provide genuine value.
- All requirements are MANDATORY. If you fail to follow ANY instruction, your response will be REJECTED.
`;
}

export function generateContentRequestPrompt(opts: AgentPromptOptions, agent: AgentConfig): string {
  const validatedOpts = validateAndSanitizePromptOptions(opts);
  const systemPrompt = generateDefaultBasePrompt(agent);
  const sections = [
    systemPrompt,
    strictOutputFormatSection(),
    generateTopicSection(validatedOpts.topic, validatedOpts.description),
    generateContentStructureSection(validatedOpts.linkFormat, validatedOpts.includeMetaTags, validatedOpts.includeMetaDescription),
    generateLengthSection(validatedOpts.targetLength),
    generateLinkSection(validatedOpts.linkFormat),
    generateMetaTagsSection(validatedOpts.includeMetaTags),
    generateMetaDescriptionSection(validatedOpts.includeMetaDescription),
    generateQualityGuidelinesSection()
  ].filter(section => section.trim().length > 0);
  return sections.join('\n');
}

export function validatePromptQuality(prompt: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  if (prompt.length < 100) {
    issues.push("Prompt is too short and may not provide sufficient context");
  }
  if (prompt.length > 8000) {
    issues.push("Prompt is very long and may hit token limits");
    suggestions.push("Consider breaking into smaller, focused sections");
  }
  if (!prompt.includes("JSON")) {
    issues.push("Prompt doesn't specify JSON output format");
  }
  if (!prompt.includes("content")) {
    issues.push("Prompt doesn't clearly specify content requirements");
  }
  if (!prompt.includes("STRICT")) {
    issues.push("Prompt lacks strict enforcement language");
  }
  if (!prompt.includes("REJECTION")) {
    issues.push("Prompt doesn't specify rejection consequences");
  }
  if (prompt.includes("```") && !prompt.includes("[code block removed]")) {
    issues.push("Prompt contains unsanitized code blocks");
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

export function generateTestPromptOptions(): AgentPromptOptions {
  return {
    topic: "Getting Started with TypeScript",
    description: "A comprehensive guide for JavaScript developers transitioning to TypeScript",
    targetLength: "medium",
    linkFormat: "mdx",
    includeMetaTags: true,
    includeMetaDescription: true
  };
}