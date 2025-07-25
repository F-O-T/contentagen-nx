import { Type as T, type Static } from "@sinclair/typebox";

// 1. Voice & Tone
export const VoiceConfigSchema = T.Object({
  communication: T.Union([T.Literal("I"), T.Literal("we"), T.Literal("you")]),
});

// 2. Audience
export const AudienceConfigSchema = T.Object({
  base: T.Union([
    T.Literal("general_public"),
    T.Literal("professionals"),
    T.Literal("beginners"),
    T.Literal("customers"),
  ]),
});

// 3. Format & Structure
export const FormatConfigSchema = T.Object({
  style: T.Union([
    T.Literal("structured"),
    T.Literal("narrative"),
    T.Literal("list_based"),
  ]),
  listStyle: T.Optional(T.Union([T.Literal("bullets"), T.Literal("numbered")])),
});

// 4. Language
export const LanguageConfigSchema = T.Object({
  primary: T.Union([T.Literal("en"), T.Literal("pt"), T.Literal("es")]),
  variant: T.Optional(T.String()), // en-US, pt-BR...
});

// 5. Brand Asset Bundle
export const BrandConfigSchema = T.Object({
  integrationStyle: T.Union([
    T.Literal("strict_guideline"),
    T.Literal("flexible_guideline"),
    T.Literal("reference_only"),
    T.Literal("creative_blend"),
  ]),
  blacklistWords: T.Optional(T.Array(T.String())),
});

// 6. Repurposing — strongly-typed channels
export const PurposeChannelSchema = T.Union([
  T.Literal("blog_post"),
  T.Literal("linkedin_post"),
  T.Literal("twitter_thread"),
  T.Literal("instagram_post"),
  T.Literal("instagram_story"),
  T.Literal("tiktok_script"),
  T.Literal("email_newsletter"),
  T.Literal("reddit_post"),
  T.Literal("youtube_script"),
  T.Literal("slide_deck"),
  T.Literal("video_script"),
  T.Literal("technical_documentation"),
]);

// 7. Top-level PersonaConfig
export const PersonaConfigSchema = T.Object({
  metadata: T.Object({ name: T.String(), description: T.String() }),
  voice: T.Partial(VoiceConfigSchema),
  audience: T.Partial(AudienceConfigSchema),
  formatting: T.Partial(FormatConfigSchema),
  language: T.Partial(LanguageConfigSchema),
  brand: T.Partial(BrandConfigSchema),
  purpose: T.Partial(PurposeChannelSchema),
});

// 8. Static Type exports
export type VoiceConfig = Static<typeof VoiceConfigSchema>;
export type AudienceConfig = Static<typeof AudienceConfigSchema>;
export type FormatConfig = Static<typeof FormatConfigSchema>;
export type LanguageConfig = Static<typeof LanguageConfigSchema>;
export type BrandConfig = Static<typeof BrandConfigSchema>;
export type PurposeChannel = Static<typeof PurposeChannelSchema>;
export type PersonaConfig = Static<typeof PersonaConfigSchema>;
