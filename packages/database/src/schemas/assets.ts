import {
   integer,
   pgTable,
   text,
   timestamp,
   uuid,
} from "drizzle-orm/pg-core";

export const assets = pgTable("assets", {
   id: uuid("id").defaultRandom().primaryKey(),
   organizationId: text("organization_id").notNull(),
   teamId: text("team_id"), // null = org-wide
   fileKey: text("file_key").notNull().unique(),
   bucket: text("bucket").notNull().default("contentta"),
   filename: text("filename").notNull(),
   mimeType: text("mime_type").notNull(),
   size: integer("size").notNull(), // bytes
   width: integer("width"),
   height: integer("height"),
   alt: text("alt"),
   caption: text("caption"),
   tags: text("tags").array().notNull().default([]),
   thumbnailKey: text("thumbnail_key"),
   publicUrl: text("public_url").notNull(),
   uploaderId: text("uploader_id").notNull(),
   createdAt: timestamp("created_at").defaultNow().notNull(),
   updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type AssetInsert = typeof assets.$inferInsert;
