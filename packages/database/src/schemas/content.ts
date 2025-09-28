import {
   pgTable,
   uuid,
   text,
   jsonb,
   timestamp,
   index,
   pgEnum,
   integer,
} from "drizzle-orm/pg-core";
import { agent } from "./agent";
import { z } from "zod";
import {
   createInsertSchema,
   createSelectSchema,
   createUpdateSchema,
} from "drizzle-zod";
import { relations } from "drizzle-orm";
import { contentVersion } from "./content-version";

export const ContentRequestSchema = z.object({
   description: z.string().min(1, "Description is required"),
   layout: z.enum(["tutorial", "article", "changelog"]),
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
   reasonOfTheRating: z
      .string()
      .optional()
      .describe(
         "The reason for the quality score rating, written in markdown.",
      ),
});
export type ContentStats = z.infer<typeof ContentStatsSchema>;

export const ContentMetaSchema = z.object({
   title: z.string().optional().describe("The title of the content."),
   description: z
      .string()
      .optional()
      .describe("A brief seo optmized description of the content."),
   keywords: z
      .array(z.string())
      .optional()
      .describe("SEO optimized keywords associated with the content."),
   slug: z
      .string()
      .optional()
      .describe("A URL-friendly identifier for the content."),
   sources: z
      .array(z.string())
      .optional()
      .describe("Sources or references used in the content."),
});
export type ContentMeta = z.infer<typeof ContentMetaSchema>;

export const contentStatusEnum = pgEnum("content_status", [
   "pending",
   "draft",
   "approved",
]);

export const shareStatusEnum = pgEnum("share_status", ["private", "shared"]);

export const content = pgTable(
   "content",
   {
      id: uuid("id").primaryKey().defaultRandom(),
      agentId: uuid("agent_id")
         .notNull()
         .references(() => agent.id, { onDelete: "cascade" }),
      imageUrl: text("image_url"),
      body: text("body").notNull().default(""),
      status: contentStatusEnum("status").default("pending"),
      shareStatus: shareStatusEnum("share_status").default("private"),
      meta: jsonb("meta").$type<ContentMeta>().default({}),
      request: jsonb("request").$type<ContentRequest>().notNull(),
      stats: jsonb("stats").$type<ContentStats>().default({}),
      currentVersion: integer("current_version").default(0),
      createdAt: timestamp("created_at")
         .$defaultFn(() => new Date())
         .notNull(),

      updatedAt: timestamp("updated_at")
         .$defaultFn(() => new Date())
         .notNull(),
   },
   (table) => [index("content_agent_id_idx").on(table.agentId)],
);
export const contentRelations = relations(content, ({ one, many }) => ({
   agent: one(agent, {
      fields: [content.agentId],
      references: [agent.id],
   }),
   versions: many(contentVersion),
}));

export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type ShareStatus = (typeof shareStatusEnum.enumValues)[number];
export type ContentSelect = typeof content.$inferSelect;
export type ContentInsert = typeof content.$inferInsert;
export const ContentInsertSchema = createInsertSchema(content);
export const ContentSelectSchema = createSelectSchema(content);
export const ContentUpdateSchema = createUpdateSchema(content);
export const ListContentByAgentInputSchema = z.object({
   status: z
      .enum(
         contentStatusEnum.enumValues,
         "Invalid content status. Must be one of: draft, approved.",
      )
      .array(),
   agentId: z.array(z.uuid("Invalid Agent ID format.")),
   limit: z.number().min(1).max(100).optional().default(10),
   page: z.number().min(1).optional().default(1),
});

export const GetContentByIdInputSchema = z.object({
   id: z.uuid("Invalid Content ID format."),
});

export const GetContentBySlugInputSchema = z.object({
   slug: z.string().min(1, "Slug is required."),
   agentId: z.uuid("Invalid Agent ID format."),
});
