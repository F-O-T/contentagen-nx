import { ORPCError } from "@orpc/server";
import { getContentById } from "@packages/database/repositories/content-repository";
import {
   addRelatedContent,
   getRelatedContentBySourceId,
   removeRelatedContent,
   updateRelatedContentOrder,
} from "@packages/database/repositories/related-content-repository";
import { relatedContent as relatedContentTable } from "@packages/database/schemas/related-content";
import {
   emitClusterSatelliteAdded,
   emitClusterSatelliteRemoved,
} from "@packages/events/clusters";
import { createEmitFn } from "@packages/events/emit";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Add a satellite post to a pillar (source → target).
 */
export const addSatellite = protectedProcedure
   .input(
      z.object({
         pillarId: z.string().uuid(),
         satelliteId: z.string().uuid(),
         relationType: z.enum(["manual", "ai_suggested"]).default("manual"),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId, teamId, posthog } = context;

      const [pillar, satellite] = await Promise.all([
         getContentById(db, input.pillarId),
         getContentById(db, input.satelliteId),
      ]);

      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }
      if (!satellite || satellite.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Satellite not found." });
      }

      const { data, created } = await addRelatedContent(db, {
         sourceContentId: input.pillarId,
         targetContentId: input.satelliteId,
         relationType: input.relationType,
      });

      if (!created) {
         return data;
      }

      try {
         await emitClusterSatelliteAdded(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            {
               clusterId: input.pillarId,
               satelliteId: input.satelliteId,
               relationType: input.relationType,
            },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return data;
   });

/**
 * Remove a satellite from a pillar.
 */
export const removeSatellite = protectedProcedure
   .input(
      z.object({
         pillarId: z.string().uuid(),
         satelliteId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, userId, teamId, posthog } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }

      const result = await removeRelatedContent(
         db,
         input.pillarId,
         input.satelliteId,
      );

      try {
         await emitClusterSatelliteRemoved(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            {
               clusterId: input.pillarId,
               satelliteId: input.satelliteId,
            },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return result;
   });

/**
 * List satellites for a given pillar, with target content metadata.
 */
export const listSatellites = protectedProcedure
   .input(z.object({ pillarId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }

      return getRelatedContentBySourceId(db, input.pillarId);
   });

/**
 * Reorder satellites within a pillar.
 */
export const reorderSatellites = protectedProcedure
   .input(
      z.object({
         pillarId: z.string().uuid(),
         orderedSatelliteIds: z.array(z.string().uuid()),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const pillar = await getContentById(db, input.pillarId);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Pillar not found." });
      }

      return updateRelatedContentOrder(
         db,
         input.pillarId,
         input.orderedSatelliteIds,
      );
   });

/**
 * Get internal link suggestions for a given content piece.
 * Returns role + suggestion list based on cluster membership.
 *
 * Note: When content appears as a satellite in multiple clusters,
 * only the first cluster's pillar and siblings are returned.
 */
export const getSuggestions = protectedProcedure
   .input(z.object({ contentId: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;

      const content = await getContentById(db, input.contentId);
      if (!content || content.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found." });
      }

      // Check if this content is a pillar (has satellites)
      const satellites = await getRelatedContentBySourceId(db, input.contentId);

      if (satellites.length > 0) {
         // This content is a pillar
         const suggestions = satellites
            .filter((s) => s.targetContent !== null)
            .map((s) => {
               const tc = s.targetContent;
               const meta = tc.meta as { title?: string; slug?: string } | null;
               const slug = meta?.slug;
               return {
                  id: tc.id,
                  title: meta?.title ?? "",
                  slug: slug ?? "",
                  status: tc.status,
                  url: `/conteudo/${slug || tc.id}`,
               };
            });

         return { role: "pillar" as const, suggestions };
      }

      // Check if this content is a satellite (appears as a target in some cluster)
      const asSatellite = await db.query.relatedContent.findMany({
         where: eq(relatedContentTable.targetContentId, input.contentId),
         with: { sourceContent: true },
      });

      if (asSatellite.length > 0) {
         // This content is a satellite — include the pillar + sibling satellites
         const pillarId = asSatellite[0].sourceContentId;

         // Get pillar info
         const pillar = await getContentById(db, pillarId);

         // Get sibling satellites (all satellites of the same pillar)
         const siblings = await getRelatedContentBySourceId(db, pillarId);

         const suggestions: Array<{
            id: string;
            title: string;
            slug: string;
            status: string;
            url: string;
         }> = [];

         // Add pillar as a suggestion
         if (pillar && pillar.organizationId === organizationId) {
            const pillarMeta = pillar.meta as {
               title?: string;
               slug?: string;
            } | null;
            const pillarSlug = pillarMeta?.slug;
            suggestions.push({
               id: pillar.id,
               title: pillarMeta?.title ?? "",
               slug: pillarSlug ?? "",
               status: pillar.status,
               url: `/conteudo/${pillarSlug || pillar.id}`,
            });
         }

         // Add sibling satellites (exclude self)
         for (const sibling of siblings) {
            if (sibling.targetContent === null) continue;
            if (sibling.targetContentId === input.contentId) continue;
            if (sibling.targetContent.organizationId !== organizationId)
               continue;
            const tc = sibling.targetContent;
            const meta = tc.meta as { title?: string; slug?: string } | null;
            const slug = meta?.slug;
            suggestions.push({
               id: tc.id,
               title: meta?.title ?? "",
               slug: slug ?? "",
               status: tc.status,
               url: `/conteudo/${slug || tc.id}`,
            });
         }

         return { role: "satellite" as const, suggestions };
      }

      // Not in any cluster
      return { role: "standalone" as const, suggestions: [] };
   });
