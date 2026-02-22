import { ORPCError } from "@orpc/server";
import { getContentById } from "@packages/database/repositories/content-repository";
import { getPublishedRelatedContent } from "@packages/database/repositories/related-content-repository";
import { z } from "zod";
import { sdkProcedure } from "../server";

/**
 * Get embed config + published satellite entries for a cluster pillar.
 * Used by the ContenttaChangelogClient SDK embed.
 */
export const getEmbed = sdkProcedure
   .input(z.object({ pillarId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (
         !pillar ||
         !pillar.clusterConfig ||
         Object.keys(pillar.clusterConfig).length === 0
      ) {
         throw new ORPCError("NOT_FOUND", { message: "Cluster not found." });
      }

      if (!pillar.clusterConfig.embedEnabled) {
         throw new ORPCError("FORBIDDEN", {
            message: "Embed not enabled for this cluster.",
         });
      }

      const entries = await getPublishedRelatedContent(db, input.pillarId);

      return {
         config: pillar.clusterConfig,
         pillarTitle: pillar.meta.title,
         entries: entries.map((e) => ({
            id: e.id,
            title: e.meta.title,
            description: e.meta.description,
            createdAt: e.createdAt,
         })),
      };
   });

/**
 * Get a single published cluster entry by ID.
 */
export const getEntry = sdkProcedure
   .input(z.object({ contentId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db } = context;

      const item = await getContentById(db, input.contentId);
      if (
         !item ||
         item.status !== "published" ||
         item.shareStatus !== "shared"
      ) {
         throw new ORPCError("NOT_FOUND", { message: "Entry not found." });
      }

      return {
         id: item.id,
         title: item.meta.title,
         description: item.meta.description,
         body: item.body,
         createdAt: item.createdAt,
      };
   });
