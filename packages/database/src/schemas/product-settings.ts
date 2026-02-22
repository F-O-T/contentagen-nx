import { relations, sql } from "drizzle-orm";
import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { team } from "./auth";

/**
 * Zod schema for content defaults
 */
export const ContentDefaultsSchema = z.object({
   defaultWriterId: z.string().uuid().optional(),
   autoGenerateSlug: z.boolean().optional(),
   defaultShareStatus: z.enum(["private", "shared"]).optional(),
});

export type ContentDefaults = z.infer<typeof ContentDefaultsSchema>;

/**
 * Zod schema for forms defaults
 */
export const FormsDefaultsSchema = z.object({
   successMessage: z.string().optional(),
   redirectUrl: z.string().url().optional(),
   sendEmailNotification: z.boolean().optional(),
   emailRecipients: z.array(z.string().email()).optional(),
});

export type FormsDefaults = z.infer<typeof FormsDefaultsSchema>;

/**
 * Zod schema for AI defaults
 */
export const AIDefaultsSchema = z.object({
   defaultLanguage: z.enum(["pt-BR", "en-US", "es"]).optional(),
   contentModel: z
      .enum([
         "openrouter/x-ai/grok-4.1-fast",
         "openrouter/google/gemini-3-flash-preview",
         "openrouter/openai/gpt-oss-120b",
         "openrouter/openai/gpt-oss-20b",
         "openrouter/moonshotai/kimi-k2.5",
         "openrouter/minimax/minimax-m2.5",
         "openrouter/z-ai/glm-5",
         "openrouter/bytedance-seed/seed-1.6-flash",
         "openrouter/liquid/lfm2-8b-a1b",
      ])
      .optional(),
   autocompleteModel: z
      .enum([
         "openrouter/openai/gpt-oss-20b",
         "openrouter/liquid/lfm2-8b-a1b",
         "openrouter/liquid/lfm-2.2-6b",
         "openrouter/google/gemini-2.5-flash-lite",
         "openrouter/stepfun/step-3.5-flash",
      ])
      .optional(),
   editModel: z
      .enum([
         "openrouter/openai/gpt-oss-20b",
         "openrouter/z-ai/glm-4.7-flash",
         "openrouter/x-ai/grok-4.1-fast",
      ])
      .optional(),
   contentTemperature: z.number().min(0).max(2).optional(),
   contentMaxTokens: z.number().int().positive().optional(),
   autocompleteTemperature: z.number().min(0).max(2).optional(),
   editTemperature: z.number().min(0).max(2).optional(),
   searchDepth: z.enum(["basic", "advanced"]).optional(),
   searchMaxResults: z.number().int().positive().optional(),
   includeSearchAnswer: z.boolean().optional(),
   searchTimeRange: z.enum(["day", "week", "month", "year", "all"]).optional(),
   preferredSearchProvider: z.enum(["tavily", "exa", "firecrawl"]).optional(),
   requireAuthoritativeSources: z.boolean().optional(),
   minCredibility: z.enum(["high", "medium", "low"]).optional(),
   ragMaxResults: z.number().int().positive().optional(),
   ragMinScore: z.number().min(0).max(1).optional(),
   ragEnabled: z.boolean().optional(),
   maxChatTokens: z.number().int().positive().optional(),
   maxReasoningSteps: z.number().int().positive().optional(),
   imageGenerationModel: z
      .enum([
         "sourceful/riverflow-v2-pro",
         "sourceful/riverflow-v2-fast",
         "bytedance-seed/seedream-4.5",
         "black-forest-labs/flux.2-klein-4b",
         "black-forest-labs/flux.2-pro",
         "black-forest-labs/flux.2-flex",
         "black-forest-labs/flux.2-max",
         "google/gemini-2.5-flash-image",
         "google/gemini-3-pro-image-preview",
         "openai/gpt-5-image",
      ])
      .optional(),
});

export type AIDefaults = z.infer<typeof AIDefaultsSchema>;

/**
 * Product Settings — per-team product configuration defaults.
 */
export const productSettings = pgTable("product_settings", {
   id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
   teamId: uuid("team_id")
      .notNull()
      .unique()
      .references(() => team.id, { onDelete: "cascade" }),
   contentDefaults: jsonb("content_defaults")
      .$type<ContentDefaults>()
      .default({}),
   formsDefaults: jsonb("forms_defaults").$type<FormsDefaults>().default({}),
   aiDefaults: jsonb("ai_defaults").$type<AIDefaults>().default({}),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
});

export const productSettingsRelations = relations(
   productSettings,
   ({ one }) => ({
      team: one(team, {
         fields: [productSettings.teamId],
         references: [team.id],
      }),
   }),
);

export type ProductSettings = typeof productSettings.$inferSelect;
export type ProductSettingsInsert = typeof productSettings.$inferInsert;

export const ProductSettingsInsertSchema = createInsertSchema(productSettings);
export const ProductSettingsSelectSchema = createSelectSchema(productSettings);
