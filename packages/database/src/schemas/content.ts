import { relations, sql } from "drizzle-orm";
import {
   index,
   jsonb,
   pgEnum,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { member, organization, team } from "./auth";
import { relatedContent } from "./related-content";
import { writer } from "./writer";

// Content status enum (traditional CMS flow)
export const contentStatusEnum = pgEnum("content_status", [
   "draft",
   "published",
   "archived",
]);

// Content share status enum
export const contentShareStatusEnum = pgEnum("content_share_status", [
   "private",
   "shared",
]);

// Draft origin enum (how the first draft was created)
export const draftOriginEnum = pgEnum("draft_origin", [
   "manual",
   "ai_generated",
]);

// Zod schema for content meta
export const ContentMetaSchema = z.object({
   title: z.string(),
   description: z.string(),
   slug: z.string(),
   keywords: z.array(z.string()).optional(),
   sources: z.array(z.string()).optional(),
});

export type ContentMeta = z.infer<typeof ContentMetaSchema>;

// Zod schema for AI generation request (optional)
export const ContentRequestSchema = z.object({
   description: z.string(),
   layout: z.enum(["tutorial", "article", "changelog"]),
});

export type ContentRequest = z.infer<typeof ContentRequestSchema>;

// Zod schema for AI stats (optional - only for AI full generation)
export const ContentStatsSchema = z.object({
   qualityScore: z.string(),
   readTimeMinutes: z.string(),
   wordsCount: z.string(),
   reasonOfTheRating: z.string().optional(),
});

export type ContentStats = z.infer<typeof ContentStatsSchema>;

// Zod schema for cluster configuration (set when content is a cluster pillar)
export const ClusterEmbedSettingsSchema = z.object({
   theme: z.enum(["light", "dark", "auto"]).optional(),
   position: z.enum(["bottom-right", "bottom-left", "inline"]).optional(),
   accentColor: z.string().optional(),
   label: z.string().optional(),
});

export const ClusterConfigSchema = z.object({
   mode: z.string().optional(),
   embedEnabled: z.boolean().optional(),
   embedSettings: ClusterEmbedSettingsSchema.optional(),
});

export type ClusterConfig = z.infer<typeof ClusterConfigSchema>;
export type ClusterEmbedSettings = z.infer<typeof ClusterEmbedSettingsSchema>;

export const content = pgTable(
   "content",
   {
      id: uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey(),
      writerId: uuid("writer_id").references(() => writer.id, {
         onDelete: "cascade",
      }),
      organizationId: uuid("organization_id")
         .notNull()
         .references(() => organization.id, { onDelete: "cascade" }),
      teamId: uuid("team_id").references(() => team.id, {
         onDelete: "cascade",
      }),
      createdByMemberId: uuid("created_by_member_id")
         .notNull()
         .references(() => member.id, { onDelete: "cascade" }),
      body: text("body").default(""),
      imageUrl: text("image_url"),
      status: contentStatusEnum("status").default("draft").notNull(),
      shareStatus: contentShareStatusEnum("share_status")
         .default("private")
         .notNull(),
      draftOrigin: draftOriginEnum("draft_origin").default("manual").notNull(),
      meta: jsonb("meta").$type<ContentMeta>().notNull(),
      request: jsonb("request").$type<ContentRequest>(),
      stats: jsonb("stats").$type<ContentStats>(),
      clusterConfig: jsonb("cluster_config")
         .$type<ClusterConfig>()
         .default({})
         .notNull(),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at")
         .defaultNow()
         .$onUpdate(() => new Date())
         .notNull(),
   },
   (table) => [
      index("content_writer_id_idx").on(table.writerId),
      index("content_organization_id_idx").on(table.organizationId),
      index("content_team_id_idx").on(table.teamId),
      index("content_created_by_member_id_idx").on(table.createdByMemberId),
      index("content_status_idx").on(table.status),
      index("content_draft_origin_idx").on(table.draftOrigin),
      index("content_slug_idx").on(table.organizationId), // For slug lookups within organization
   ],
);

export const contentRelations = relations(content, ({ one, many }) => ({
   writer: one(writer, {
      fields: [content.writerId],
      references: [writer.id],
   }),
   organization: one(organization, {
      fields: [content.organizationId],
      references: [organization.id],
   }),
   team: one(team, {
      fields: [content.teamId],
      references: [team.id],
   }),
   createdByMember: one(member, {
      fields: [content.createdByMemberId],
      references: [member.id],
   }),
   relatedFrom: many(relatedContent, { relationName: "relatedFrom" }),
   relatedTo: many(relatedContent, { relationName: "relatedTo" }),
}));

export type Content = typeof content.$inferSelect;
export type ContentInsert = typeof content.$inferInsert;
export type ContentStatus = (typeof contentStatusEnum.enumValues)[number];
export type ContentShareStatus =
   (typeof contentShareStatusEnum.enumValues)[number];
export type DraftOrigin = (typeof draftOriginEnum.enumValues)[number];

export const ContentInsertSchema = createInsertSchema(content);
export const ContentSelectSchema = createSelectSchema(content);
