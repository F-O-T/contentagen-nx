import { relations } from "drizzle-orm";
import {
  uuid,
  text,
  jsonb,
  pgTable,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { Type as T, type Static, type TSchema } from "@sinclair/typebox";

/* ------------------------------------------------------------------
   1.  Re-usable primitives
------------------------------------------------------------------ */
const Weighted = <S extends TSchema>(s: S) =>
  T.Object({ value: s, weight: T.Number({ minimum: 0, maximum: 1 }) });
const Percent = T.Number({ minimum: 0, maximum: 1 });
const Grade = T.Number({ minimum: 1, maximum: 12 });

/* ------------------------------------------------------------------
   2.  Voice & Tone
------------------------------------------------------------------ */
export const VoiceConfigSchema = T.Object({
  toneMix: T.Array(
    Weighted(
      T.Union([
        T.Literal("professional"),
        T.Literal("conversational"),
        T.Literal("educational"),
        T.Literal("creative"),
        T.Literal("witty"),
        T.Literal("empathetic"),
      ]),
    ),
  ),
  formality: Percent,
  humorLevel: Percent,
  emojiDensity: Percent,
  readingGrade: Grade,
  communication: T.Union([T.Literal("I"), T.Literal("we"), T.Literal("you")]),
  forbiddenWords: T.Optional(T.Array(T.String())),
  requiredHooks: T.Optional(T.Array(T.String())),
});

/* ------------------------------------------------------------------
   3.  Audience
------------------------------------------------------------------ */
export const AudienceConfigSchema = T.Object({
  base: T.Union([
    T.Literal("general_public"),
    T.Literal("professionals"),
    T.Literal("beginners"),
    T.Literal("customers"),
  ]),
  personas: T.Optional(T.Array(T.String())), // buyer-persona names
  regions: T.Optional(T.String()), // comma-separated string
});

/* ------------------------------------------------------------------
   4.  Format & Structure
------------------------------------------------------------------ */
export const FormatConfigSchema = T.Object({
  style: T.Union([
    T.Literal("structured"),
    T.Literal("narrative"),
    T.Literal("list_based"),
  ]),
  headingDensity: T.Optional(
    T.Union([T.Literal("low"), T.Literal("medium"), T.Literal("high")]),
  ),
  listStyle: T.Optional(T.Union([T.Literal("bullets"), T.Literal("numbered")])),
  includeToc: T.Optional(T.Boolean()),
  maxParagraphLen: T.Optional(T.Number({ minimum: 20 })),
});

/* ------------------------------------------------------------------
   5.  Language
------------------------------------------------------------------ */
export const LanguageConfigSchema = T.Object({
  primary: T.Union([T.Literal("en"), T.Literal("pt"), T.Literal("es")]),
  variant: T.Optional(T.String()), // en-US, pt-BR...
});

/* ------------------------------------------------------------------
   6.  Brand Asset Bundle
------------------------------------------------------------------ */
const BrandAssetSchema = T.Object({
  type: T.Union([
    T.Literal("logo"),
    T.Literal("colorPalette"),
    T.Literal("typography"),
    T.Literal("voiceGuide"),
    T.Literal("boilerplate"),
    T.Literal("customBlock"),
  ]),
  payload: T.Any(), // validated in UI; stored as-is
});

export const BrandConfigSchema = T.Object({
  integrationStyle: T.Union([
    T.Literal("strict_guideline"),
    T.Literal("flexible_guideline"),
    T.Literal("reference_only"),
    T.Literal("creative_blend"),
  ]),
  assets: T.Array(BrandAssetSchema),
  blacklistWords: T.Optional(T.Array(T.String())),
  productNames: T.Optional(T.Array(T.String())),
  compliance: T.Optional(
    T.Object({
      gdpr: T.Boolean({ default: false }),
      hipaa: T.Boolean({ default: false }),
      fda: T.Boolean({ default: false }),
    }),
  ),
});

/* ------------------------------------------------------------------
   7.  SEO & On-Page
------------------------------------------------------------------ */
const SeoConfigSchema = T.Object({
  primaryKeyword: T.String(),
  secondaryKeywords: T.Optional(T.Array(T.String())),
  enforceTitleH1: T.Boolean({ default: true }),
  autoSlug: T.Boolean({ default: true }),
  omitMeta: T.Boolean({ default: true }),
});

/* ------------------------------------------------------------------
   8.  DataForSEO Toolkit
------------------------------------------------------------------ */
const DataForSeoConfigSchema = T.Object({
  enabled: T.Boolean({ default: false }),
});

/* ------------------------------------------------------------------
   9.  Repurposing — strongly-typed channels
------------------------------------------------------------------ */
export const RepurposeChannelSchema = T.Union([
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

const RepurposeConfigSchema = T.Object({
  pillarId: T.Optional(T.String({ format: "uuid" })),
  channels: T.Array(RepurposeChannelSchema),
  promptTemplate: T.Optional(T.String()),
});

/* ------------------------------------------------------------------
  10.  Top-level PersonaConfig
------------------------------------------------------------------ */
export const PersonaConfigSchema = T.Object({
  version: T.Literal("2.1"),
  metadata: T.Object({ name: T.String(), description: T.String() }),
  voice: T.Partial(VoiceConfigSchema),
  audience: T.Partial(AudienceConfigSchema),
  formatting: T.Partial(FormatConfigSchema),
  language: T.Partial(LanguageConfigSchema),
  seo: T.Partial(SeoConfigSchema),
  dataforseo: T.Partial(DataForSeoConfigSchema),
  brand: T.Partial(BrandConfigSchema),
  repurpose: T.Partial(RepurposeConfigSchema),
});

/* ------------------------------------------------------------------
  11.  Static Type exports
------------------------------------------------------------------ */
export type VoiceConfig = Static<typeof VoiceConfigSchema>;
export type AudienceConfig = Static<typeof AudienceConfigSchema>;
export type FormatConfig = Static<typeof FormatConfigSchema>;
export type LanguageConfig = Static<typeof LanguageConfigSchema>;
export type BrandAsset = Static<typeof BrandAssetSchema>;
export type BrandConfig = Static<typeof BrandConfigSchema>;
export type SeoConfig = Static<typeof SeoConfigSchema>;
export type DataForSeoConfig = Static<typeof DataForSeoConfigSchema>;
export type RepurposeChannel = Static<typeof RepurposeChannelSchema>;
export type RepurposeConfig = Static<typeof RepurposeConfigSchema>;
export type PersonaConfig = Static<typeof PersonaConfigSchema>;

/* ------------------------------------------------------------------
  12.  Drizzle table definition
------------------------------------------------------------------ */
export const agent = pgTable(
  "agent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    personaConfig: jsonb("persona_config").$type<PersonaConfig>().notNull(),
    systemPrompt: text("system_prompt").notNull(),

    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true),
    totalDrafts: integer("total_drafts").default(0),
    totalPublished: integer("total_published").default(0),
    uploadedFiles: jsonb("uploaded_files")
      .$type<{ fileName: string; fileUrl: string; uploadedAt: string }[]>()
      .default([]),
    createdAt: timestamp("created_at")
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: timestamp("updated_at")
      .$defaultFn(() => new Date())
      .notNull(),
    lastGeneratedAt: timestamp("last_generated_at"),
  },
  (table) => [index("agent_user_id_idx").on(table.userId)],
);

export const agentRelations = relations(agent, ({ one }) => ({
  user: one(user, {
    fields: [agent.userId],
    references: [user.id],
  }),
}));

export type AgentSelect = typeof agent.$inferSelect;
export type AgentInsert = typeof agent.$inferInsert;

import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";

export const AgentInsertSchema = createInsertSchema(agent);
export const AgentSelectSchema = createSelectSchema(agent);
export const AgentUpdateSchema = createUpdateSchema(agent);
