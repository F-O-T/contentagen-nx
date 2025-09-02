import {
   pgTable,
   uuid,
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
   sources: z.array(z.string()).optional(),
});
export type IdeaMeta = z.infer<typeof IdeiaMetaSchema>;
export const IdeaContentSchema = z.object({
   title: z.string().min(1).describe("The headline of the blog post idea"),
   description: z
      .string()
      .min(1)
      .describe("The meta description of the blog post idea"),
});
export const ConfidenceScoreSchema = z.object({
   score: z.string().min(1).describe("Confidence score between 0 and 100"),
   rationale: z
      .string()
      .optional()
      .describe("Rationale for the confidence score"),
});
export type ConfidenceScoreSchema = z.infer<typeof ConfidenceScoreSchema>;
export type IdeaContentSchema = z.infer<typeof IdeaContentSchema>;
export const ideas = pgTable(
   "ideas",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      agentId: uuid("agent_id")
         .notNull()
         .references(() => agent.id, { onDelete: "cascade" }),
      content: jsonb("content").$type<IdeaContentSchema>().notNull().default({
         title: "",
         description: "",
      }),
      confidence: jsonb("confidence")
         .$type<ConfidenceScoreSchema>()
         .notNull()
         .default({
            score: "0",
            rationale: "",
         }),
      status: ideiaStatusEnum("status").default("pending"),
      meta: jsonb("meta").$type<IdeaMeta>().default({
         tags: [],
         sources: [],
      }),
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
