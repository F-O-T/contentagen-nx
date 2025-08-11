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

export const ContentRequestSchema = z.object({
   description: z.string().min(1, "Description is required"),
});
export type ContentRequest = z.infer<typeof ContentRequestSchema>;
export const ContentStatsSchema = z.object({
   wordsCount: z
      .string()
      .optional()
      .describe("The number of words in the content."),
   readTimeMinutes: z
      .string()
      .optional()
      .describe("Estimated reading time in minutes."),
   qualityScore: z
      .string()
      .optional()
      .describe("A score representing the quality of the content."),
});
export type ContentStats = z.infer<typeof ContentStatsSchema>;

export const ContentMetaSchema = z.object({
   title: z.string().optional().describe("The title of the content."),
   slug: z
      .string()
      .optional()
      .describe("A URL-friendly identifier for the content."),
   tags: z
      .array(z.string())
      .optional()
      .describe("Tags associated with the content."),
   topics: z
      .array(z.string())
      .optional()
      .describe("Topics covered in the content."),
   sources: z
      .array(z.string())
      .optional()
      .describe("Sources referenced for the content."),
});
export type ContentMeta = z.infer<typeof ContentMetaSchema>;

export const contentStatusEnum = pgEnum("content_status", [
   "draft",
   "approved",
   "generating",
]);

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
export const ListContentByAgentInputSchema = z.object({
   status: z.enum(
      contentStatusEnum.enumValues,
      "Invalid content status. Must be one of: draft, approved, generating.",
   ),
   agentId: z.uuid("Invalid Agent ID format."),
   limit: z.number().min(1).max(100).optional().default(10),
   page: z.number().min(1).optional().default(1),
});

export const GetContentByIdInputSchema = z.object({
   id: z.uuid("Invalid Content ID format."),
});
