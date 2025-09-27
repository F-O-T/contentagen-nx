import { relations } from "drizzle-orm";
import {
   index,
   jsonb,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { organization, user } from "./auth";

// 1. Instructions Configuration
export const InstructionsSchema = z.object({
   audienceProfile: z.string().min(1, "This field is required").default("-"),
   writingGuidelines: z.string().min(1, "This field is required").default("-"),
   ragIntegration: z.string().min(1, "This field is required").default("-"),
});

// 2. Repurposing — strongly-typed channels
export const PurposeChannelSchema = z.enum(["blog_post"]);

// 3. Top-level PersonaConfig
export const PersonaConfigSchema = z.object({
   metadata: z.object({
      name: z.string().min(1, "This field is required"),
      description: z.string().min(1, "This field is required"),
   }),
   instructions: InstructionsSchema.optional(),
   purpose: PurposeChannelSchema.optional(),
});

export const agent = pgTable(
   "agent",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      organizationId: text("organization_id").references(
         () => organization.id,
         { onDelete: "cascade" },
      ),
      personaConfig: jsonb("persona_config").$type<PersonaConfig>().notNull(),
      profilePhotoUrl: text("profile_photo_url"),
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

export type InstructionsConfig = z.infer<typeof InstructionsSchema>;
export type PurposeChannel = z.infer<typeof PurposeChannelSchema>;
export type PersonaConfig = z.infer<typeof PersonaConfigSchema>;
