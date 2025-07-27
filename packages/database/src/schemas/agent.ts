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
import { z } from "zod";
import { createSchemaFactory } from "drizzle-zod";
import type { PersonaConfig } from "./agent-types";
import { user } from "./auth";
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
