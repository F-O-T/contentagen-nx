import { relations } from "drizzle-orm";
import {
   pgTable,
   jsonb,
   uuid,
   text,
   boolean,
   integer,
   timestamp,
   index,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { user } from "./auth";
import { z } from "zod";

// 1. Voice & Tone
export const VoiceConfigSchema = z.object({
   communication: z.enum(["first_person", "third_person"]),
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
   variant: z
      .enum(["en-US", "en-GB", "pt-BR", "pt-PT", "es-ES", "es-MX"])
      .optional(),
});

// 5. Brand Asset Bundle
export const BrandConfigSchema = z.object({
   integrationStyle: z.enum([
      "strict_guideline",
      "flexible_guideline",
      "reference_only",
      "creative_blend",
   ]),
   blacklistWords: z.string().optional(),
});

// 6. Repurposing — strongly-typed channels
export const PurposeChannelSchema = z.enum([
   "blog_post",
   "linkedin_post",
   "twitter_thread",
   "instagram_post",
   "email_newsletter",
   "reddit_post",
   "technical_documentation",
]);

// 7. Top-level PersonaConfig
export const PersonaConfigSchema = z.object({
   metadata: z.object({
      name: z.string().min(1, "This field is required"),
      description: z.string().min(1, "This field is required"),
   }),
   voice: VoiceConfigSchema.partial().optional(),
   audience: AudienceConfigSchema.partial().optional(),
   formatting: FormatConfigSchema.partial().optional(),
   language: LanguageConfigSchema.partial().optional(),
   brand: BrandConfigSchema.partial().optional(),
   purpose: PurposeChannelSchema.optional(),
});

// 8. Static Type exports

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
   createSchemaFactory({
      zodInstance: z,
   });
export const agent = pgTable(
   "agent",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),

      personaConfig: jsonb("persona_config").$type<PersonaConfig>().notNull(),
      systemPrompt: text("system_prompt").notNull(),
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
export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;
export type AudienceConfig = z.infer<typeof AudienceConfigSchema>;
export type FormatConfig = z.infer<typeof FormatConfigSchema>;
export type LanguageConfig = z.infer<typeof LanguageConfigSchema>;
export type BrandConfig = z.infer<typeof BrandConfigSchema>;
export type PurposeChannel = z.infer<typeof PurposeChannelSchema>;
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;
