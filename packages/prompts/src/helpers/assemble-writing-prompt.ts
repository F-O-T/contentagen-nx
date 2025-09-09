import type { PersonaConfig } from "@packages/database/schemas/agent";
import { metadataBasePrompt } from "../prompts/metadata/base";
import { firstPersonPrompt } from "../prompts/voice/first_person";
import { thirdPersonPrompt } from "../prompts/voice/third_person";
import { generalPublicAudiencePrompt } from "../prompts/audience/general_public";
import { professionalsAudiencePrompt } from "../prompts/audience/professionals";
import { beginnersAudiencePrompt } from "../prompts/audience/beginners";
import { customersAudiencePrompt } from "../prompts/audience/customers";
import { LanguageBasePrompt } from "../prompts/language/language-base";
import { strictGuidelinePrompt } from "../prompts/brand/strict_guideline";
import { flexibleGuidelinePrompt } from "../prompts/brand/flexible_guideline";
import { referenceOnlyPrompt } from "../prompts/brand/reference_only";
import { creativeBlendPrompt } from "../prompts/brand/creative_blend";
import { searchIntegrationSystemPrompt } from "../prompts/search/search-integrations";
import { writingDraftSystemPrompt } from "../prompts/writing/writing-draft";
import { languageCorrectionBasePrompt } from "../prompts/language/language-corrections";

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
   return metadataBasePrompt({
      name: config.metadata.name,
      description: config.metadata.description,
   });
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
         return generalPublicAudiencePrompt();
      case "professionals":
         return professionalsAudiencePrompt();
      case "beginners":
         return beginnersAudiencePrompt();
      case "customers":
         return customersAudiencePrompt();
      default:
         return "";
   }
}

export function createLanguageSection(
   config: PersonaConfig,
   shouldReturnJson?: boolean,
): string {
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
   if (shouldReturnJson) {
      return languageCorrectionBasePrompt({
         languageDisplay,
         languageRules,
         culturalNotes,
         language: languageDisplay,
      });
   }

   return LanguageBasePrompt({
      languageDisplay,
      languageRules,
      culturalNotes,
      language: languageDisplay,
   });
}

export function createBrandSection(config: PersonaConfig): string {
   if (!config.brand?.integrationStyle) {
      return "";
   }
   const raw = config.brand.blacklistWords;
   const blacklistWords: string[] = Array.isArray(raw)
      ? raw
      : typeof raw === "string" && raw.length > 0
        ? [raw]
        : [];
   switch (config.brand.integrationStyle) {
      case "strict_guideline":
         return strictGuidelinePrompt({ blacklistWords });
      case "flexible_guideline":
         return flexibleGuidelinePrompt({ blacklistWords });
      case "reference_only":
         return referenceOnlyPrompt({ blacklistWords });
      case "creative_blend":
         return creativeBlendPrompt({ blacklistWords });
      default:
         return "";
   }
}

// Task section generator

// Main system prompt generator
export function generateWritingPrompt(config: PersonaConfig): string {
   const sections = [
      createMetadataSection(config),
      createBrandSection(config),
      createAudienceSection(config),
      createVoiceSection(config),
      searchIntegrationSystemPrompt(),
   ];
   return sections.filter(Boolean).join(`\n\n${"=".repeat(80)}\n\n`);
}
