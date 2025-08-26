import {
   pgTable,
   uuid,
   text,
   jsonb,
   timestamp,
   index,
   pgEnum,
} from "drizzle-orm/pg-core";
import { agent } from "./agent";
import { z } from "zod";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";
import { relations } from "drizzle-orm";

export const ideiaStatusEnum = pgEnum("ideia_status", [
   "pending",
   "approved",
   "rejected",
]);

export const IdeiaMetaSchema = z.object({
   tags: z.array(z.string()).optional(),
   source: z.string().optional(),
});
export type IdeaMeta = z.infer<typeof IdeiaMetaSchema>;

export const ideas = pgTable(
   "ideas",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      agentId: uuid("agent_id")
         .notNull()
         .references(() => agent.id, { onDelete: "cascade" }),
      content: text("content").notNull(),
      status: ideiaStatusEnum("status").default("pending"),
      meta: jsonb("meta").$type<IdeaMeta>().default({}),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [index("ideias_agent_id_idx").on(table.agentId)],
);

export const ideasRelations = relations(ideas, ({ one }) => ({
   agent: one(agent, {
      fields: [ideas.agentId],
      references: [agent.id],
   }),
}));

export type IdeiaStatus = (typeof ideiaStatusEnum.enumValues)[number];
export type IdeaSelect = typeof ideas.$inferSelect;
export type IdeaInsert = typeof ideas.$inferInsert;
export const IdeaInsertSchema = createInsertSchema(ideas);
export const IdeaSelectSchema = createSelectSchema(ideas);
export const IdeaUpdateSchema = createUpdateSchema(ideas);
