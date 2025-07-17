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
import { Type as T, type Static } from "@sinclair/typebox";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-typebox";

/* ------------------------------------------------------------------
   1. TypeBox Schemas for JSONB fields
------------------------------------------------------------------ */
export const ContentRequestSchema = T.Object({
   topic: T.String(),
   briefDescription: T.String(),
});
export type ContentRequest = Static<typeof ContentRequestSchema>;

export const ContentStatsSchema = T.Object({
   wordsCount: T.Optional(T.Number({ minimum: 0 })),
   readTimeMinutes: T.Optional(T.Number({ minimum: 0 })),
   qualityScore: T.Optional(T.Number({ minimum: 0, maximum: 100 })),
});
export type ContentStats = Static<typeof ContentStatsSchema>;

export const ContentMetaSchema = T.Object({
   slug: T.Optional(T.String()),
   tags: T.Optional(T.Array(T.String())),
   topics: T.Optional(T.Array(T.String())),
   sources: T.Optional(T.Array(T.String())),
});
export type ContentMeta = Static<typeof ContentMetaSchema>;

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
      title: text("title").notNull(),
      body: text("body").notNull(),
      status: contentStatusEnum("status").default("draft"),
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
export type Content = typeof content.$inferSelect;
export type ContentInsert = typeof content.$inferInsert;

export const ContentInsertSchema = createInsertSchema(content);
export const ContentSelectSchema = createSelectSchema(content);
export const ContentUpdateSchema = createUpdateSchema(content);
