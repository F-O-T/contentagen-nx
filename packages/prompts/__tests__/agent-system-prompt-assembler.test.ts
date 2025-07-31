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
   createTaskSection,
   validatePersonaConfig,
   validateContentRequest,
   previewPromptSections,
   generateTemplateStructure,
   type ContentRequest,
   type PromptOptions,
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

   const mockOptions: PromptOptions = {
      contentRequest: {
         topic: "Digital Marketing Trends 2024",
         briefDescription:
            "Write a comprehensive blog post about the top digital marketing trends for 2024",
      },
      additionalContext: "Focus on AI integration and privacy-first marketing",
      specificRequirements: [
         "Include case studies",
         "Mention ROI considerations",
         "Add actionable tips",
      ],
   };

   describe("Individual Section Creators", () => {
      it("should create metadata section correctly", () => {
         const section = createMetadataSection(mockPersonaConfig);
         expect(section).toContain(
            "AI Assistant Identity: Content Marketing Expert",
         );
         expect(section).toContain("specialized content creation expert");
         expect(section).toContain(mockPersonaConfig.metadata.description);
      });

      it("should return empty string for missing metadata", () => {
         const configWithoutMetadata = {} as PersonaConfig;
         const section = createMetadataSection(configWithoutMetadata);
         expect(section).toBe("");
      });

      it("should create voice section correctly for first person", () => {
         const section = createVoiceSection(mockPersonaConfig);
         expect(section).toContain("Voice & Communication: First Person");
         expect(section).toContain('using "I", "me", and "my"');
         expect(section).toContain("In my experience");
      });

      it("should create voice section correctly for third person", () => {
         const thirdPersonConfig: PersonaConfig = {
            ...mockPersonaConfig,
            voice: { communication: "third_person" },
         };
         const section = createVoiceSection(thirdPersonConfig);
         expect(section).toContain("Voice & Communication: Third Person");
         expect(section).toContain("[Brand] recommends");
      });

      it("should create audience section correctly", () => {
         const section = createAudienceSection(mockPersonaConfig);
         expect(section).toContain("Target Audience: Professionals");
         expect(section).toContain("3+ years experience");
         expect(section).toContain("industry terminology");
      });

      it("should create formatting section correctly for structured", () => {
         const section = createFormattingSection(mockPersonaConfig);
         expect(section).toContain("Content Formatting: Structured Format");
         expect(section).toContain("descriptive, keyword-rich headings");
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
         expect(section).toContain("Content Formatting: List-Based Format");
         expect(section).toContain("numbered lists (1, 2, 3)");
      });

      it("should create language section correctly for US English", () => {
         const section = createLanguageSection(mockPersonaConfig);
         expect(section).toContain("Language Guidelines: US English");
         expect(section).toContain("American spelling");
         expect(section).toContain("MM/DD/YYYY date format");
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
         expect(section).toContain("Brazilian Portuguese");
         expect(section).toContain("você vs. senhor/senhora");
      });

      it("should create brand section correctly", () => {
         const section = createBrandSection(mockPersonaConfig);
         expect(section).toContain("Brand Integration: Flexible Guidelines");
         expect(section).toContain("cheap, discount, sale");
         expect(section).toContain("Content Restrictions");
      });

      it("should create brand section without blacklist words", () => {
         const configWithoutBlacklist: PersonaConfig = {
            ...mockPersonaConfig,
            brand: {
               integrationStyle: "strict_guideline",
            },
         };
         const section = createBrandSection(configWithoutBlacklist);
         expect(section).toContain("Brand Integration: Strict Guidelines");
         expect(section).not.toContain("Content Restrictions");
      });

      it("should create purpose section correctly", () => {
         const section = createPurposeSection(mockPersonaConfig);
         expect(section).toContain("Content Channel: Blog Post");
         expect(section).toContain("Long-form content");
         expect(section).toContain("SEO-optimized");
      });

      it("should create task section correctly", () => {
         const section = createTaskSection(mockOptions);
         expect(section).toContain("Content Creation Task");
         expect(section).toContain("Digital Marketing Trends 2024");
         expect(section).toContain("comprehensive blog post");
         expect(section).toContain("Include case studies");
         expect(section).toContain("Focus on AI integration");
      });

      it("should create task section without optional fields", () => {
         const minimalOptions: PromptOptions = {
            contentRequest: {
               topic: "Simple Topic",
               briefDescription: "Simple description",
            },
         };
         const section = createTaskSection(minimalOptions);
         expect(section).toContain("Simple Topic");
         expect(section).toContain("Simple description");
         expect(section).not.toContain("Additional Context");
         expect(section).not.toContain("Specific Requirements");
      });
   });

   describe("Full System Prompt Generation", () => {
      it("should generate complete system prompt with all sections", () => {
         const prompt = generateSystemPrompt(mockPersonaConfig, mockOptions);

         // Check all sections are present
         expect(prompt).toContain(
            "AI Assistant Identity: Content Marketing Expert",
         );
         expect(prompt).toContain("Voice & Communication: First Person");
         expect(prompt).toContain("Target Audience: Professionals");
         expect(prompt).toContain("Content Formatting: Structured Format");
         expect(prompt).toContain("Language Guidelines: US English");
         expect(prompt).toContain("Brand Integration: Flexible Guidelines");
         expect(prompt).toContain("Content Channel: Blog Post");
         expect(prompt).toContain("Content Creation Task");

         // Check for separators
         expect(prompt).toContain("=".repeat(80));

         // Check content from each section
         expect(prompt).toContain("Digital Marketing Trends 2024");
         expect(prompt).toContain("cheap, discount, sale");
         expect(prompt).toContain("American spelling");
      });

      it("should handle minimal persona config", () => {
         const minimalConfig: PersonaConfig = {
            metadata: {
               name: "Simple Bot",
               description: "A basic content creator",
            },
         };

         const prompt = generateSystemPrompt(minimalConfig, mockOptions);

         expect(prompt).toContain("AI Assistant Identity: Simple Bot");
         expect(prompt).toContain("Content Creation Task");
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

         const prompt = generateSystemPrompt(partialConfig, mockOptions);

         expect(prompt).toContain("AI Assistant Identity: Partial Bot");
         expect(prompt).toContain("Voice & Communication: Third Person");
         expect(prompt).toContain("Target Audience: Beginners");
         expect(prompt).toContain("Content Creation Task");
         expect(prompt).not.toContain("Brand Integration");
         expect(prompt).not.toContain("Language Guidelines");
      });

      it("should maintain proper section ordering", () => {
         const prompt = generateSystemPrompt(mockPersonaConfig, mockOptions);
         const sections = prompt.split("=".repeat(80));

         expect(sections[0]).toContain("AI Assistant Identity");
         expect(sections[1]).toContain("Voice & Communication");
         expect(sections[2]).toContain("Target Audience");
         expect(sections[3]).toContain("Content Formatting");
         expect(sections[4]).toContain("Language Guidelines");
         expect(sections[5]).toContain("Brand Integration");
         expect(sections[6]).toContain("Content Channel");
         expect(sections[7]).toContain("Content Creation Task");
      });
   });

   describe("Template Structure", () => {
      it("should provide complete template structure", () => {
         const structure = generateTemplateStructure();

         expect(structure.metadata).toContain("base");
         expect(structure.voice).toEqual(["first_person", "third_person"]);
         expect(structure.audience).toEqual([
            "general_public",
            "professionals",
            "beginners",
            "customers",
         ]);
         expect(structure.formatting).toEqual([
            "structured",
            "narrative",
            "list_based",
         ]);
         expect(structure.language).toContain("base");
         expect(structure.brand).toEqual([
            "strict_guideline",
            "flexible_guideline",
            "reference_only",
            "creative_blend",
         ]);
         expect(structure.purpose).toEqual([
            "blog_post",
            "linkedin_post",
            "twitter_thread",
            "instagram_post",
            "email_newsletter",
            "reddit_post",
            "technical_documentation",
         ]);
         expect(structure.task).toContain("base");
      });
   });

   describe("Validation Functions", () => {
      it("should validate persona config correctly", () => {
         const validErrors = validatePersonaConfig(mockPersonaConfig);
         expect(validErrors).toHaveLength(0);
      });

      it("should return errors for invalid persona config", () => {
         const invalidConfig: PersonaConfig = {
            metadata: {
               name: "",
               description: "",
            },
         };
         const errors = validatePersonaConfig(invalidConfig);
         expect(errors).toContain("Persona name is required");
         expect(errors).toContain("Persona description is required");
      });

      it("should handle missing metadata in persona config", () => {
         const configWithoutMetadata = {} as PersonaConfig;
         const errors = validatePersonaConfig(configWithoutMetadata);
         expect(errors.length).toBeGreaterThan(0);
      });

      it("should validate content request correctly", () => {
         const validErrors = validateContentRequest(mockOptions.contentRequest);
         expect(validErrors).toHaveLength(0);
      });

      it("should return errors for invalid content request", () => {
         const invalidRequest: ContentRequest = {
            topic: "",
            briefDescription: "",
         };
         const errors = validateContentRequest(invalidRequest);
         expect(errors).toContain("Topic is required");
         expect(errors).toContain("Brief description is required");
      });

      it("should validate content length limits", () => {
         const longRequest: ContentRequest = {
            topic: "a".repeat(250), // Over 200 character limit
            briefDescription: "b".repeat(1100), // Over 1000 character limit
         };
         const errors = validateContentRequest(longRequest);
         expect(errors).toContain(
            "Topic should be under 200 characters for clarity",
         );
         expect(errors).toContain(
            "Brief description should be under 1000 characters",
         );
      });
   });

   describe("Preview Sections", () => {
      it("should generate preview sections correctly", () => {
         const preview = previewPromptSections(mockPersonaConfig);

         expect(preview).toContain(
            "Persona Identity: Content Marketing Expert",
         );
         expect(preview).toContain("Voice: first person");
         expect(preview).toContain("Audience: professionals");
         expect(preview).toContain("Formatting: structured (bullets)");
         expect(preview).toContain("Language: EN (en-US)");
         expect(preview).toContain("Brand Integration: flexible guideline");
         expect(preview).toContain("Purpose: blog post");
         expect(preview).toContain("Content Creation Task");
      });

      it("should handle minimal config in preview", () => {
         const minimalConfig: PersonaConfig = {
            metadata: {
               name: "Simple Bot",
               description: "A basic bot",
            },
         };

         const preview = previewPromptSections(minimalConfig);

         expect(preview).toContain("Persona Identity: Simple Bot");
         expect(preview).toContain("Content Creation Task");
         expect(preview).toHaveLength(2);
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
            expect(section).toContain("Brand Integration:");
            expect(section.length).toBeGreaterThan(0);
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
            expect(section).toContain("Content Channel:");
            expect(section.length).toBeGreaterThan(0);
         });
      });

      it("should handle empty sections gracefully", () => {
         const emptyConfig: PersonaConfig = {
            metadata: {
               name: "Test",
               description: "Test",
            },
         };

         const prompt = generateSystemPrompt(emptyConfig, mockOptions);

         // Should still have metadata and task sections
         expect(prompt).toContain("AI Assistant Identity: Test");
         expect(prompt).toContain("Content Creation Task");

         // Should not have empty sections
         expect(prompt).not.toContain("Voice & Communication:\n\n");
         expect(prompt).not.toContain("Target Audience:\n\n");
      });

      it("should estimate prompt tokens correctly", () => {
         const prompt = generateSystemPrompt(mockPersonaConfig, mockOptions);
         const estimated = Math.ceil(prompt.length / 3.5);

         // Should be reasonable token count for a full prompt
         expect(estimated).toBeGreaterThan(500);
         expect(estimated).toBeLessThan(5000);
      });
   });
});

