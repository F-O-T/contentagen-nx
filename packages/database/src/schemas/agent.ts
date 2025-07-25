import { relations } from "drizzle-orm";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-typebox";

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
import { Type as T, type Static } from "@sinclair/typebox";

/* ------------------------------------------------------------------
   1.  Re-usable primitives
------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   2.  Voice & Tone
------------------------------------------------------------------ */
export const VoiceConfigSchema = T.Object({
   communication: T.Union([T.Literal("I"), T.Literal("we"), T.Literal("you")]),
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
   listStyle: T.Optional(
      T.Union([T.Literal("bullets"), T.Literal("numbered")]),
   ),
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

export const BrandConfigSchema = T.Object({
   integrationStyle: T.Union([
      T.Literal("strict_guideline"),
      T.Literal("flexible_guideline"),
      T.Literal("reference_only"),
      T.Literal("creative_blend"),
   ]),
   blacklistWords: T.Optional(T.Array(T.String())),
});

/* ------------------------------------------------------------------
   7.  SEO & On-Page
------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   8.  DataForSEO Toolkit
------------------------------------------------------------------ */

/* ------------------------------------------------------------------
   9.  Repurposing — strongly-typed channels
------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------
  10.  Top-level PersonaConfig
------------------------------------------------------------------ */
export const PersonaConfigSchema = T.Object({
   metadata: T.Object({ name: T.String(), description: T.String() }),
   voice: T.Partial(VoiceConfigSchema),
   audience: T.Partial(AudienceConfigSchema),
   formatting: T.Partial(FormatConfigSchema),
   language: T.Partial(LanguageConfigSchema),
   brand: T.Partial(BrandConfigSchema),
   purpose: T.Partial(PurposeChannelSchema),
});

/* ------------------------------------------------------------------
  11.  Static Type exports
------------------------------------------------------------------ */
export type VoiceConfig = Static<typeof VoiceConfigSchema>;
export type AudienceConfig = Static<typeof AudienceConfigSchema>;
export type FormatConfig = Static<typeof FormatConfigSchema>;
export type LanguageConfig = Static<typeof LanguageConfigSchema>;
export type BrandConfig = Static<typeof BrandConfigSchema>;
export type PurposeChannel = Static<typeof PurposeChannelSchema>;
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

export const AgentInsertSchema = createInsertSchema(agent);
export const AgentSelectSchema = createSelectSchema(agent);
export const AgentUpdateSchema = createUpdateSchema(agent);
