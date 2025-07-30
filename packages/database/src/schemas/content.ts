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
import { user } from "./auth";
import { z } from "zod";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";

/* ------------------------------------------------------------------
   1. Zod Schemas for JSONB fields
------------------------------------------------------------------ */
export const ContentRequestSchema = z.object({
   description: z.string().min(1, "Description is required"),
});
export type ContentRequest = z.infer<typeof ContentRequestSchema>;

export const ContentStatsSchema = z.object({
   wordsCount: z.number().min(0).optional(),
   readTimeMinutes: z.number().min(0).optional(),
   qualityScore: z.number().min(0).max(100).optional(),
});
export type ContentStats = z.infer<typeof ContentStatsSchema>;

export const ContentMetaSchema = z.object({
   slug: z.string().optional(),
   tags: z.array(z.string()).optional(),
   topics: z.array(z.string()).optional(),
   sources: z.array(z.string()).optional(),
});
export type ContentMeta = z.infer<typeof ContentMetaSchema>;

/* ------------------------------------------------------------------
   2. Content Status Enum
------------------------------------------------------------------ */
export const contentStatusEnum = pgEnum("content_status", [
   "draft",
   "approved",
   "generating",
]);

/* ------------------------------------------------------------------
   3. Content Table
------------------------------------------------------------------ */
export const content = pgTable(
   "content",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      agentId: uuid("agent_id")
         .notNull()
         .references(() => agent.id, { onDelete: "cascade" }),
      userId: text("user_id")
         .notNull()
         .references(() => user.id, { onDelete: "cascade" }),
      title: text("title").notNull().default(""),
      body: text("body").notNull().default(""),
      status: contentStatusEnum("status").default("generating"),
      meta: jsonb("meta").$type<ContentMeta>().default({}),
      request: jsonb("request").$type<ContentRequest>().notNull(),
      stats: jsonb("stats").$type<ContentStats>().default({}),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),
      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [index("content_agent_id_idx").on(table.agentId)],
);

export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type ContentSelect = typeof content.$inferSelect;
export type ContentInsert = typeof content.$inferInsert;

export const ContentInsertSchema = createInsertSchema(content);
export const ContentSelectSchema = createSelectSchema(content);
export const ContentUpdateSchema = createUpdateSchema(content);
