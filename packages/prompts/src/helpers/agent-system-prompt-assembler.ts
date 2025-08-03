import type { PersonaConfig } from "@packages/database/schemas/agent";

// Prompt template imports (kebab-case)
import { basePrompt } from "../prompt-files/metadata/base-prompt";
import { firstPersonPrompt } from "../prompt-files/voice/first-person-prompt";
import { thirdPersonPrompt } from "../prompt-files/voice/third-person-prompt";
import { generalPublicPrompt } from "../prompt-files/audience/general-public-prompt";
import { professionalsPrompt } from "../prompt-files/audience/professionals-prompt";
import { beginnersPrompt } from "../prompt-files/audience/beginners-prompt";
import { customersPrompt } from "../prompt-files/audience/customers-prompt";
import { structuredPrompt } from "../prompt-files/formatting/structured-prompt";
import { narrativePrompt } from "../prompt-files/formatting/narrative-prompt";
import { listBasedPrompt } from "../prompt-files/formatting/list-based-prompt";
import { baseLanguagePrompt } from "../prompt-files/language/base-prompt";
import { strictGuidelinePrompt } from "../prompt-files/brand/strict-guideline-prompt";
import { flexibleGuidelinePrompt } from "../prompt-files/brand/flexible-guideline-prompt";
import { referenceOnlyPrompt } from "../prompt-files/brand/reference-only-prompt";
import { creativeBlendPrompt } from "../prompt-files/brand/creative-blend-prompt";
import { blogPostPrompt } from "../prompt-files/purpose/blog-post-prompt";
import { linkedinPostPrompt } from "../prompt-files/purpose/linkedin-post-prompt";
import { twitterThreadPrompt } from "../prompt-files/purpose/twitter-thread-prompt";
import { instagramPostPrompt } from "../prompt-files/purpose/instagram-post-prompt";
import { emailNewsletterPrompt } from "../prompt-files/purpose/email-newsletter-prompt";
import { redditPostPrompt } from "../prompt-files/purpose/reddit-post-prompt";
import { technicalDocumentationPrompt } from "../prompt-files/purpose/technical-documentation-prompt";

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


// Individual helper functions for each section
export function createMetadataSection(config: PersonaConfig): string {
   if (!config.metadata?.name || !config.metadata?.description) {
      return "";
   }
   return basePrompt({ name: config.metadata.name, description: config.metadata.description });
}

export function createVoiceSection(config: PersonaConfig): string {
   if (!config.voice?.communication) {
      return "";
   }
   switch (config.voice.communication) {
      case "first_person":
         return firstPersonPrompt();
      case "third_person":
         return thirdPersonPrompt();
      default:
         return "";
   }
}

export function createAudienceSection(config: PersonaConfig): string {
   if (!config.audience?.base) {
      return "";
   }
   switch (config.audience.base) {
      case "general_public":
         return generalPublicPrompt();
      case "professionals":
         return professionalsPrompt();
      case "beginners":
         return beginnersPrompt();
      case "customers":
         return customersPrompt();
      default:
         return "";
   }
}

export function createFormattingSection(config: PersonaConfig): string {
   if (!config.formatting?.style) {
      return "";
   }
   switch (config.formatting.style) {
      case "structured":
         return structuredPrompt();
      case "narrative":
         return narrativePrompt();
      case "list_based": {
         let listStyle: string | undefined;
         if (config.formatting.listStyle) {
            listStyle = config.formatting.listStyle === "bullets"
               ? "bullet points (•)"
               : "numbered lists (1, 2, 3)";
         }
         return listBasedPrompt({ listStyle });
      }
      default:
         return "";
   }
}

export function createLanguageSection(config: PersonaConfig): string {
   if (!config.language?.primary) {
      return "";
   }
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
      }
   }
   return baseLanguagePrompt({ languageDisplay, languageRules, culturalNotes });
}

export function createBrandSection(config: PersonaConfig): string {
   if (!config.brand?.integrationStyle) {
      return "";
   }
   const raw = config.brand.blacklistWords;
   const blacklistWords = Array.isArray(raw)
      ? raw
      : typeof raw === "string" && raw.length > 0
         ? [raw]
         : undefined;
   switch (config.brand.integrationStyle) {
      case "strict_guideline":
         return strictGuidelinePrompt({ blacklistWords });
      case "flexible_guideline":
         return flexibleGuidelinePrompt({ blacklistWords });
      case "reference_only":
         return referenceOnlyPrompt();
      case "creative_blend":
         return creativeBlendPrompt();
      default:
         return "";
   }
}

export function createPurposeSection(config: PersonaConfig): string {
   if (!config.purpose) {
      return "";
   }
   switch (config.purpose) {
      case "blog_post":
         return blogPostPrompt();
      case "linkedin_post":
         return linkedinPostPrompt();
      case "twitter_thread":
         return twitterThreadPrompt();
      case "instagram_post":
         return instagramPostPrompt();
      case "email_newsletter":
         return emailNewsletterPrompt();
      case "reddit_post":
         return redditPostPrompt();
      case "technical_documentation":
         return technicalDocumentationPrompt();
      default:
         return "";
   }
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
      sections.push(
         `Audience: ${personaConfig.audience.base.replace("_", " ")}`,
      );
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
