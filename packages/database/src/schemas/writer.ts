import { relations, sql } from "drizzle-orm";
import {
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { organization, team } from "./auth";
import type { InstructionMemoryItem } from "./instruction-memory";

// Zod schema for persona configuration
export const PersonaMetadataSchema = z.object({
   name: z.string(),
   description: z.string().optional(),
   avatar: z.string().optional(),
});

// Brand term usage rules
export const BrandTermSchema = z.object({
   term: z.string(),
   usage: z.enum(["always_use", "never_use", "preferred"]),
   alternative: z.string().optional(), // Suggested alternative if "never_use"
});

export type BrandTerm = z.infer<typeof BrandTermSchema>;

// Structured writer configuration
export const WriterConfigSchema = z.object({
   // === Writing Style (structured) ===
   tone: z
      .enum(["formal", "conversational", "professional", "casual", "academic"])
      .optional(),
   voice: z.enum(["first_person", "second_person", "third_person"]).optional(),
   complexity: z.enum(["simple", "moderate", "advanced"]).optional(), // vocabulary level

   // === Content Rules (structured) ===
   targetWordCount: z
      .object({
         min: z.number().optional(),
         max: z.number().optional(),
      })
      .optional(),
   headingStructure: z
      .object({
         maxDepth: z.number().min(2).max(6).default(3), // h2-h6
         requireH2Every: z.number().optional(), // words between h2s
      })
      .optional(),
   seoRules: z
      .object({
         minKeywordDensity: z.number().optional(), // e.g., 0.5%
         maxKeywordDensity: z.number().optional(), // e.g., 2.5%
         requireMetaDescription: z.boolean().default(true),
         maxTitleLength: z.number().default(60),
      })
      .optional(),

   // === Brand Guidelines (structured) ===
   brandTerms: z.array(BrandTermSchema).optional(),

   // === Free-form Custom Rules (for backward compatibility and flexibility) ===
   writingGuidelines: z.string().optional(), // Detailed prose instructions
   audienceProfile: z.string().optional(), // Who we're writing for
   customRules: z.string().optional(), // Additional free-form rules

   // === Feature Flags ===
   ragIntegration: z.boolean().default(true),
   enableInternalLinking: z.boolean().default(true),
   enableFactChecking: z.boolean().default(false),
});

export type WriterConfig = z.infer<typeof WriterConfigSchema>;

// Legacy PersonaInstructionsSchema - kept for backward compatibility
// Maps to WriterConfig internally
export const PersonaInstructionsSchema = WriterConfigSchema;

export const PersonaConfigSchema = z.object({
   metadata: PersonaMetadataSchema,
   instructions: PersonaInstructionsSchema.optional(),
});

export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;

export const writer = pgTable(
   "writer",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id")
         .notNull()
         .references(() => team.id, { onDelete: "cascade" }),
      personaConfig: jsonb("persona_config").$type<PersonaConfig>().notNull(),
      profilePhotoUrl: text("profile_photo_url"),
      instructionMemories: jsonb("instruction_memories")
         .$type<InstructionMemoryItem[]>()
         .default([]),
      lastGeneratedAt: timestamp("last_generated_at"),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("writer_organization_id_idx").on(table.organizationId),
      index("writer_team_idx").on(table.teamId),
   ],
);

export const writerRelations = relations(writer, ({ one }) => ({
   organization: one(organization, {
      fields: [writer.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [writer.teamId],
      references: [team.id],
   }),
}));

export type Writer = typeof writer.$inferSelect;
export type WriterInsert = typeof writer.$inferInsert;

export const WriterInsertSchema = createInsertSchema(writer);
export const WriterSelectSchema = createSelectSchema(writer);
