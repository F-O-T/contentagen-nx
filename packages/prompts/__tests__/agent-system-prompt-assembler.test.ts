import { describe, it, expect } from "vitest";
import {
   generateSystemPrompt,
   createMetadataSection,
   createVoiceSection,
   createAudienceSection,
   createFormattingSection,
   createLanguageSection,
   createBrandSection,
   createPurposeSection,
} from "../src/helpers/agent-system-prompt-assembler";
import type { PersonaConfig } from "@packages/database/schemas/agent";

describe("Agent System Prompt Assembler", () => {
   const mockPersonaConfig: PersonaConfig = {
      metadata: {
         name: "Content Marketing Expert",
         description:
            "An AI specialized in creating engaging marketing content that converts and builds brand awareness.",
      },
      voice: {
         communication: "first_person",
      },
      audience: {
         base: "professionals",
      },
      formatting: {
         style: "structured",
         listStyle: "bullets",
      },
      language: {
         primary: "en",
         variant: "en-US",
      },
      brand: {
         integrationStyle: "flexible_guideline",
         blacklistWords: "cheap, discount, sale",
      },
      purpose: "blog_post",
   };

   describe("Individual Section Creators", () => {
      it("should create metadata section correctly", () => {
         const section = createMetadataSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("AI Assistant Identity");
         expect(section).toContain(mockPersonaConfig.metadata.name);
         expect(section).toContain(mockPersonaConfig.metadata.description);
      });

      it("should return empty string for missing metadata", () => {
         const configWithoutMetadata = {} as PersonaConfig;
         const section = createMetadataSection(configWithoutMetadata);
         expect(section).toBe("");
      });

      it("should create voice section correctly for first person", () => {
         const section = createVoiceSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Voice & Communication: First Person");
      });

      it("should create voice section correctly for third person", () => {
         const thirdPersonConfig: PersonaConfig = {
            ...mockPersonaConfig,
            voice: { communication: "third_person" },
         };
         const section = createVoiceSection(thirdPersonConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Voice & Communication: Third Person");
      });

      it("should create audience section correctly", () => {
         const section = createAudienceSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Target Audience:");
      });

      it("should create formatting section correctly for structured", () => {
         const section = createFormattingSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Content Formatting: Structured Format");
      });

      it("should create formatting section with list style preferences", () => {
         const listBasedConfig: PersonaConfig = {
            ...mockPersonaConfig,
            formatting: {
               style: "list_based",
               listStyle: "numbered",
            },
         };
         const section = createFormattingSection(listBasedConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Content Formatting: List-Based Format");
         expect(section).toContain("numbered lists");
      });

      it("should create language section correctly for US English", () => {
         const section = createLanguageSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Language Guidelines");
         expect(section).toContain("English");
      });

      it("should create language section for different variants", () => {
         const brazilianConfig: PersonaConfig = {
            ...mockPersonaConfig,
            language: {
               primary: "pt",
               variant: "pt-BR",
            },
         };
         const section = createLanguageSection(brazilianConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Brazilian Portuguese");
      });

      it("should create brand section correctly", () => {
         const section = createBrandSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Brand Integration");
      });

      it("should create brand section without blacklist words", () => {
         const configWithoutBlacklist: PersonaConfig = {
            ...mockPersonaConfig,
            brand: {
               integrationStyle: "strict_guideline",
            },
         };
         const section = createBrandSection(configWithoutBlacklist);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Brand Integration: Strict Guidelines");
      });

      it("should create purpose section correctly", () => {
         const section = createPurposeSection(mockPersonaConfig);
         expect(section.length).toBeGreaterThan(0);
         expect(section).toContain("Content Channel:");
      });
   });

   describe("Full System Prompt Generation", () => {
      it("should generate complete system prompt with all sections", () => {
         const prompt = generateSystemPrompt(mockPersonaConfig);
         expect(prompt.length).toBeGreaterThan(0);
         expect(prompt).toContain("AI Assistant Identity");
         expect(prompt).toContain("Voice & Communication");
         expect(prompt).toContain("Target Audience");
         expect(prompt).toContain("Content Formatting");
         expect(prompt).toContain("Language Guidelines");
         expect(prompt).toContain("Brand Integration");
         expect(prompt).toContain("Content Channel");
      });

      it("should handle minimal persona config", () => {
         const minimalConfig: PersonaConfig = {
            metadata: {
               name: "Simple Bot",
               description: "A basic content creator",
            },
         };
         const prompt = generateSystemPrompt(minimalConfig);
         expect(prompt.length).toBeGreaterThan(0);
         expect(prompt).toContain("AI Assistant Identity: Simple Bot");
         expect(prompt).not.toContain("Voice & Communication");
         expect(prompt).not.toContain("Target Audience");
         expect(prompt).not.toContain("Brand Integration");
      });

      it("should handle partial configuration gracefully", () => {
         const partialConfig: PersonaConfig = {
            metadata: {
               name: "Partial Bot",
               description: "A partially configured bot",
            },
            voice: {
               communication: "third_person",
            },
            audience: {
               base: "beginners",
            },
         };
         const prompt = generateSystemPrompt(partialConfig);
         expect(prompt.length).toBeGreaterThan(0);
         expect(prompt).toContain("AI Assistant Identity: Partial Bot");
         expect(prompt).toContain("Voice & Communication: Third Person");
         expect(prompt).toContain("Target Audience: Beginners");
         expect(prompt).not.toContain("Brand Integration");
         expect(prompt).not.toContain("Language Guidelines");
      });

      it("should maintain proper section ordering", () => {
         const prompt = generateSystemPrompt(mockPersonaConfig);
         const sections = prompt.split("=".repeat(80));
         expect(sections[0]).toContain("AI Assistant Identity");
         expect(sections[1]).toContain("Voice & Communication");
         expect(sections[2]).toContain("Target Audience");
         expect(sections[3]).toContain("Content Formatting");
         expect(sections[4]).toContain("Language Guidelines");
         expect(sections[5]).toContain("Brand Integration");
         expect(sections[6]).toContain("Content Channel");
      });
   });

   describe("Edge Cases and Error Handling", () => {
      it("should handle different language variants correctly", () => {
         const configs = [
            {
               primary: "en" as const,
               variant: "en-GB" as const,
               expected: "British English",
            },
            {
               primary: "pt" as const,
               variant: "pt-BR" as const,
               expected: "Brazilian Portuguese",
            },
            {
               primary: "es" as const,
               variant: "es-ES" as const,
               expected: "Spain Spanish",
            },
         ];
         configs.forEach(({ primary, variant, expected }) => {
            const config: PersonaConfig = {
               metadata: { name: "Test", description: "Test" },
               language: { primary, variant },
            };
            const section = createLanguageSection(config);
            expect(section.length).toBeGreaterThan(0);
            expect(section).toContain(expected);
         });
      });

      it("should handle all brand integration styles", () => {
         const styles = [
            "strict_guideline",
            "flexible_guideline",
            "reference_only",
            "creative_blend",
         ] as const;
         styles.forEach((style) => {
            const config: PersonaConfig = {
               metadata: { name: "Test", description: "Test" },
               brand: { integrationStyle: style },
            };
            const section = createBrandSection(config);
            expect(section.length).toBeGreaterThan(0);
            expect(section).toContain("Brand Integration:");
         });
      });

      it("should handle all purpose channels", () => {
         const channels = [
            "blog_post",
            "linkedin_post",
            "twitter_thread",
            "instagram_post",
            "email_newsletter",
            "reddit_post",
            "technical_documentation",
         ] as const;
         channels.forEach((channel) => {
            const config: PersonaConfig = {
               metadata: { name: "Test", description: "Test" },
               purpose: channel,
            };
            const section = createPurposeSection(config);
            expect(section.length).toBeGreaterThan(0);
            expect(section).toContain("Content Channel:");
         });
      });

      it("should handle empty sections gracefully", () => {
         const emptyConfig: PersonaConfig = {
            metadata: {
               name: "Test",
               description: "Test",
            },
         };
         const prompt = generateSystemPrompt(emptyConfig);
         expect(prompt.length).toBeGreaterThan(0);
         expect(prompt).toContain("AI Assistant Identity: Test");
         expect(prompt).not.toContain("Voice & Communication:\n\n");
         expect(prompt).not.toContain("Target Audience:\n\n");
      });
   });
});
