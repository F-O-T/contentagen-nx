import type { PersonaConfig } from "@packages/database/schemas/agent-types";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Type definitions for content request and options
export interface ContentRequest {
  topic: string;
  briefDescription: string;
}

export interface PromptOptions {
  contentRequest: ContentRequest;
  additionalContext?: string;
  specificRequirements?: string[];
}

// Cache for template files to avoid repeated file reads
const templateCache = new Map<string, string>();

function loadTemplate(category: string, filename: string): string {
  const cacheKey = `${category}/${filename}`;
  if (templateCache.has(cacheKey)) {
    const cachedContent = templateCache.get(cacheKey);
    if (cachedContent) {
      return cachedContent;
    }
  }

  try {
    const filePath = join(
      __dirname,
      "..",
      "prompt-files",
      category,
      `${filename}.md`,
    );
    const content = readFileSync(filePath, "utf-8");
    templateCache.set(cacheKey, content);
    return content;
  } catch (error) {
    console.warn(`Failed to load template ${category}/${filename}:`, error);
    return "";
  }
}

// Simple template interpolation function
// Define template variable types
type TemplateVariables = Record<
  string,
  string | boolean | string[] | undefined
>;

function interpolateTemplate(
  template: string,
  variables: TemplateVariables,
): string {
  let result = template;

  // Handle simple {{variable}} interpolations
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, String(value));
    }
  });

  // Handle conditional blocks {{#variable}}...{{/variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const blockRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, "g");
    if (value && value !== "") {
      result = result.replace(blockRegex, "$1");
    } else {
      result = result.replace(blockRegex, "");
    }
  });

  // Handle array iterations {{#array}}{{.}}{{/array}}
  Object.entries(variables).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const arrayRegex = new RegExp(`{{#${key}}}([\\s\\S]*?){{/${key}}}`, "g");
      result = result.replace(arrayRegex, (_, template) => {
        return value
          .map((item) => template.replace(/{{\.}}/g, String(item)))
          .join("\n");
      });
    }
  });

  // Clean up any remaining template syntax
  result = result.replace(/{{[^}]*}}/g, "");

  return result.trim();
}

// Individual helper functions for each section
export function createMetadataSection(config: PersonaConfig): string {
  if (!config.metadata?.name || !config.metadata?.description) {
    return "";
  }

  const template = loadTemplate("metadata", "base");
  return interpolateTemplate(template, {
    name: config.metadata.name,
    description: config.metadata.description,
  });
}

export function createVoiceSection(config: PersonaConfig): string {
  if (!config.voice?.communication) {
    return "";
  }

  const template = loadTemplate("voice", config.voice.communication);
  return template;
}

export function createAudienceSection(config: PersonaConfig): string {
  if (!config.audience?.base) {
    return "";
  }

  const template = loadTemplate("audience", config.audience.base);
  return template;
}

export function createFormattingSection(config: PersonaConfig): string {
  if (!config.formatting?.style) {
    return "";
  }

  const template = loadTemplate("formatting", config.formatting.style);

  // Handle list style for list_based formatting
  const variables: TemplateVariables = {};
  if (config.formatting.style === "list_based" && config.formatting.listStyle) {
    variables.listStyle =
      config.formatting.listStyle === "bullets"
        ? "bullet points (•)"
        : "numbered lists (1, 2, 3)";
  }

  return interpolateTemplate(template, variables);
}

export function createLanguageSection(config: PersonaConfig): string {
  if (!config.language?.primary) {
    return "";
  }

  const template = loadTemplate("language", "base");

  // Build language display string and rules
  const languageMap = {
    en: "English",
    pt: "Portuguese",
    es: "Spanish",
  };

  const variantMap = {
    "en-US": "US English (en-US)",
    "en-GB": "British English (en-GB)",
    "pt-BR": "Brazilian Portuguese (pt-BR)",
    "pt-PT": "European Portuguese (pt-PT)",
    "es-ES": "Spain Spanish (es-ES)",
    "es-MX": "Mexican Spanish (es-MX)",
  };

  let languageDisplay = languageMap[config.language.primary];
  let languageRules: string[] = [];
  let culturalNotes: string[] = [];

  if (config.language.variant && variantMap[config.language.variant]) {
    languageDisplay = variantMap[config.language.variant];

    // Add variant-specific rules
    switch (config.language.variant) {
      case "en-US":
        languageRules = [
          "Use American spelling (color, realize, organization)",
          "Apply AP or Chicago style for punctuation and grammar",
          "Use 12-hour time format and MM/DD/YYYY date format",
        ];
        culturalNotes = [
          "Reference American holidays, seasons, and cultural events",
          "Use US measurement systems when relevant",
          "Use direct, informal communication style typical of US culture",
        ];
        break;
      case "en-GB":
        languageRules = [
          "Use British spelling (colour, realise, organisation)",
          "Apply Oxford or Cambridge style guidelines",
          "Use 24-hour time format and DD/MM/YYYY date format",
        ];
        culturalNotes = [
          "Reference British holidays, seasons, and cultural events",
          "Use metric system alongside imperial when relevant",
          "Use more formal, polite communication style",
        ];
        break;
      case "pt-BR":
        languageRules = [
          "Use Brazilian Portuguese spelling and grammar rules",
          "Apply appropriate formal/informal address (você vs. senhor/senhora)",
          "Use DD/MM/YYYY date format and 24-hour time",
        ];
        culturalNotes = [
          "Reference Brazilian holidays, climate, and regional diversity",
          "Use warm, personal communication style typical of Brazilian culture",
          "Acknowledge regional differences within Brazil when relevant",
        ];
        break;
      // Add other variants as needed
    }
  }

  return interpolateTemplate(template, {
    languageDisplay,
    language: languageDisplay,
    languageRules,
    culturalNotes,
  });
}

export function createBrandSection(config: PersonaConfig): string {
  if (!config.brand?.integrationStyle) {
    return "";
  }

  const template = loadTemplate("brand", config.brand.integrationStyle);

  const variables: TemplateVariables = {};
  if (config.brand.blacklistWords) {
    variables.blacklistWords = config.brand.blacklistWords;
  }

  return interpolateTemplate(template, variables);
}

export function createPurposeSection(config: PersonaConfig): string {
  if (!config.purpose) {
    return "";
  }

  const template = loadTemplate("purpose", config.purpose);
  return template;
}

/**
 * Main system prompt generator using modular approach
 */
export function generateSystemPrompt(personaConfig: PersonaConfig): string {
  const sections: string[] = [];

  // 1. Metadata (AI Identity) - always first if available
  const metadataSection = createMetadataSection(personaConfig);
  if (metadataSection) sections.push(metadataSection);

  // 2. Voice & Communication
  const voiceSection = createVoiceSection(personaConfig);
  if (voiceSection) sections.push(voiceSection);

  // 3. Target Audience
  const audienceSection = createAudienceSection(personaConfig);
  if (audienceSection) sections.push(audienceSection);

  // 4. Content Formatting
  const formattingSection = createFormattingSection(personaConfig);
  if (formattingSection) sections.push(formattingSection);

  // 5. Language Guidelines
  const languageSection = createLanguageSection(personaConfig);
  if (languageSection) sections.push(languageSection);

  // 6. Brand Integration
  const brandSection = createBrandSection(personaConfig);
  if (brandSection) sections.push(brandSection);

  // 7. Purpose Channel
  const purposeSection = createPurposeSection(personaConfig);
  if (purposeSection) sections.push(purposeSection);

  return sections
    .filter((section) => section.trim().length > 0)
    .join(`\n\n${"=".repeat(80)}\n\n`);
}

/**
 * Validation functions
 */
export function validatePersonaConfig(config: PersonaConfig): string[] {
  const errors: string[] = [];

  if (!config.metadata?.name || config.metadata.name.trim().length === 0) {
    errors.push("Persona name is required");
  }

  if (
    !config.metadata?.description ||
    config.metadata.description.trim().length === 0
  ) {
    errors.push("Persona description is required");
  }

  return errors;
}

export function validateContentRequest(request: ContentRequest): string[] {
  const errors: string[] = [];

  if (!request.topic || request.topic.trim().length === 0) {
    errors.push("Topic is required");
  }

  if (
    !request.briefDescription ||
    request.briefDescription.trim().length === 0
  ) {
    errors.push("Brief description is required");
  }

  if (request.topic && request.topic.length > 200) {
    errors.push("Topic should be under 200 characters for clarity");
  }

  if (request.briefDescription && request.briefDescription.length > 1000) {
    errors.push("Brief description should be under 1000 characters");
  }

  return errors;
}

/**
 * Utility functions
 */
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 3.5);
}

export function previewPromptSections(personaConfig: PersonaConfig): string[] {
  const sections: string[] = [];

  if (personaConfig.metadata?.name) {
    sections.push(`Persona Identity: ${personaConfig.metadata.name}`);
  }

  if (personaConfig.voice?.communication) {
    sections.push(
      `Voice: ${personaConfig.voice.communication.replace("_", " ")}`,
    );
  }

  if (personaConfig.audience?.base) {
    sections.push(`Audience: ${personaConfig.audience.base.replace("_", " ")}`);
  }

  if (personaConfig.formatting?.style) {
    let formatDesc = personaConfig.formatting.style.replace("_", " ");
    if (personaConfig.formatting.listStyle) {
      formatDesc += ` (${personaConfig.formatting.listStyle})`;
    }
    sections.push(`Formatting: ${formatDesc}`);
  }

  if (personaConfig.language?.primary) {
    let langDesc = personaConfig.language.primary.toUpperCase();
    if (personaConfig.language.variant) {
      langDesc += ` (${personaConfig.language.variant})`;
    }
    sections.push(`Language: ${langDesc}`);
  }

  if (personaConfig.brand?.integrationStyle) {
    sections.push(
      `Brand Integration: ${personaConfig.brand.integrationStyle.replace("_", " ")}`,
    );
  }

  if (personaConfig.purpose) {
    sections.push(`Purpose: ${personaConfig.purpose.replace("_", " ")}`);
  }

  sections.push("Content Creation Task");

  return sections;
}

/**
 * Generate all template structure for debugging/documentation
 */
export function generateTemplateStructure(): Record<string, string[]> {
  return {
    metadata: ["base"],
    voice: ["first_person", "third_person"],
    audience: ["general_public", "professionals", "beginners", "customers"],
    formatting: ["structured", "narrative", "list_based"],
    language: ["base"],
    brand: [
      "strict_guideline",
      "flexible_guideline",
      "reference_only",
      "creative_blend",
    ],
    purpose: [
      "blog_post",
      "linkedin_post",
      "twitter_thread",
      "instagram_post",
      "email_newsletter",
      "reddit_post",
      "technical_documentation",
    ],
    task: ["base", "chunking", "distillation", "formatting"],
  };
}
