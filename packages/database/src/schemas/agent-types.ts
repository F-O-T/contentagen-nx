import { z } from "zod";

// 1. Voice & Tone
export const VoiceConfigSchema = z.object({
  communication: z.enum(["I", "we", "you"]),
});

// 2. Audience
export const AudienceConfigSchema = z.object({
  base: z.enum(["general_public", "professionals", "beginners", "customers"]),
});

// 3. Format & Structure
export const FormatConfigSchema = z.object({
  style: z.enum(["structured", "narrative", "list_based"]),
  listStyle: z.enum(["bullets", "numbered"]).optional(),
});

// 4. Language
export const LanguageConfigSchema = z.object({
  primary: z.enum(["en", "pt", "es"]),
  variant: z.string().optional(), // en-US, pt-BR...
});

// 5. Brand Asset Bundle
export const BrandConfigSchema = z.object({
  integrationStyle: z.enum([
    "strict_guideline",
    "flexible_guideline",
    "reference_only",
    "creative_blend",
  ]),
  blacklistWords: z.array(z.string()).optional(),
});

// 6. Repurposing — strongly-typed channels
export const PurposeChannelSchema = z.enum([
  "blog_post",
  "linkedin_post",
  "twitter_thread",
  "instagram_post",
  "instagram_story",
  "tiktok_script",
  "email_newsletter",
  "reddit_post",
  "youtube_script",
  "slide_deck",
  "video_script",
  "technical_documentation",
]);

// 7. Top-level PersonaConfig
export const PersonaConfigSchema = z.object({
  metadata: z.object({ name: z.string(), description: z.string() }),
  voice: VoiceConfigSchema.partial().optional(),
  audience: AudienceConfigSchema.partial().optional(),
  formatting: FormatConfigSchema.partial().optional(),
  language: LanguageConfigSchema.partial().optional(),
  brand: BrandConfigSchema.partial().optional(),
  purpose: PurposeChannelSchema.optional(),
});

// 8. Static Type exports
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;
export type AudienceConfig = z.infer<typeof AudienceConfigSchema>;
export type FormatConfig = z.infer<typeof FormatConfigSchema>;
export type LanguageConfig = z.infer<typeof LanguageConfigSchema>;
export type BrandConfig = z.infer<typeof BrandConfigSchema>;
export type PurposeChannel = z.infer<typeof PurposeChannelSchema>;
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;
