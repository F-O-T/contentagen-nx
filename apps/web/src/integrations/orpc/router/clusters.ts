import { ORPCError } from "@orpc/server";
import { createRequestContext, mastra } from "@packages/agents";
import {
   createContent,
   getContentById,
   listClustersByTeam,
   updateContent,
} from "@packages/database/repositories/content-repository";
import { addRelatedContent } from "@packages/database/repositories/related-content-repository";
import { ClusterConfigSchema } from "@packages/database/schemas/content";
import { emitClusterCreated } from "@packages/events/clusters";
import { createEmitFn } from "@packages/events/emit";
import { createSlug, generateRandomSuffix } from "@packages/utils/text";
import { z } from "zod";
import { protectedProcedure } from "../server";

const SuggestedSatelliteSchema = z.object({
   title: z.string(),
   description: z.string(),
});

const SuggestStructureOutputSchema = z.object({
   pillarTitle: z.string(),
   mode: z.string(),
   embedEnabled: z.boolean(),
   satellites: z.array(SuggestedSatelliteSchema),
});

export const list = protectedProcedure
   .input(
      z
         .object({
            limit: z.number().int().min(1).max(100).default(20),
            page: z.number().int().min(1).default(1),
         })
         .optional(),
   )
   .handler(async ({ context, input }) => {
      const { db, teamId } = context;
      const { limit = 20, page = 1 } = input ?? {};
      return listClustersByTeam(db, teamId, { limit, page });
   });

export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const pillar = await getContentById(db, input.id);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Cluster not found." });
      }
      if (
         !pillar.clusterConfig ||
         Object.keys(pillar.clusterConfig).length === 0
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Content is not a cluster pillar.",
         });
      }
      return pillar;
   });

export const promote = protectedProcedure
   .input(
      z.object({
         contentId: z.string().uuid(),
         clusterConfig: ClusterConfigSchema,
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const existing = await getContentById(db, input.contentId);
      if (!existing || existing.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Content not found." });
      }
      return updateContent(db, input.contentId, {
         clusterConfig: input.clusterConfig,
      });
   });

export const updateConfig = protectedProcedure
   .input(
      z.object({
         id: z.string().uuid(),
         clusterConfig: ClusterConfigSchema.partial(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId } = context;
      const pillar = await getContentById(db, input.id);
      if (!pillar || pillar.organizationId !== organizationId) {
         throw new ORPCError("NOT_FOUND", { message: "Cluster not found." });
      }
      const merged = {
         ...(pillar.clusterConfig ?? {}),
         ...input.clusterConfig,
      };
      return updateContent(db, input.id, { clusterConfig: merged });
   });

export const create = protectedProcedure
   .input(
      z.object({
         pillarTitle: z.string().min(1),
         mode: z.string().optional(),
         embedEnabled: z.boolean().default(false),
         satellites: z
            .array(z.object({ title: z.string().min(1) }))
            .max(20)
            .default([]),
      }),
   )
   .handler(async ({ context, input }) => {
      const { db, organizationId, teamId, userId, posthog, session } = context;

      const members = await db.query.member.findMany({
         where: (m, { eq, and }) =>
            and(
               eq(m.organizationId, organizationId),
               eq(m.userId, session.user.id),
            ),
      });
      if (members.length === 0) {
         throw new ORPCError("FORBIDDEN", { message: "Not a member." });
      }
      const memberId = members[0].id;

      const { pillar, satelliteResults } = await db.transaction(async (tx) => {
         const pillarSlug = `${createSlug(input.pillarTitle)}-${generateRandomSuffix()}`;
         const pillar = await createContent(tx, {
            meta: {
               title: input.pillarTitle,
               description: "",
               slug: pillarSlug,
            },
            organizationId,
            teamId,
            createdByMemberId: memberId,
            clusterConfig: {
               mode: input.mode,
               embedEnabled: input.embedEnabled,
            },
         });

         const satelliteResults = await Promise.all(
            input.satellites.map(async (s) => {
               const satSlug = `${createSlug(s.title)}-${generateRandomSuffix()}`;
               const sat = await createContent(tx, {
                  meta: { title: s.title, description: "", slug: satSlug },
                  organizationId,
                  teamId,
                  createdByMemberId: memberId,
               });
               await addRelatedContent(tx, {
                  sourceContentId: pillar.id,
                  targetContentId: sat.id,
                  relationType: "manual",
               });
               return sat;
            }),
         );

         return { pillar, satelliteResults };
      });

      try {
         await emitClusterCreated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            {
               clusterId: pillar.id,
               pillarTitle: input.pillarTitle,
               satelliteCount: satelliteResults.length,
               mode: input.mode,
            },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return { pillar, satellites: satelliteResults };
   });

export const suggestStructure = protectedProcedure
   .input(z.object({ description: z.string().min(1) }))
   .handler(async ({ context, input }) => {
      const agent = mastra.getAgent("tecoAgent");

      const prompt = `You are helping a content strategist design a Content Cluster.

A Content Cluster consists of:
1. One **pillar post** — the main comprehensive piece on the topic.
2. Multiple **satellite posts** — subtopics or related entries that link back to the pillar.

The user described their goal as:
<user_input>${input.description}</user_input>

Respond ONLY with a valid JSON object matching this exact shape:
{
  "pillarTitle": "<title for the main pillar post>",
  "mode": "<single lowercase word describing cluster type, e.g. changelog, seo, series, tutorial, docs>",
  "embedEnabled": <true if the cluster should be embeddable on external sites, false otherwise>,
  "satellites": [
    { "title": "<satellite post title>", "description": "<one-sentence description>" }
  ]
}

Suggest 3–6 satellite posts. Be specific and actionable. Do not include markdown, code fences, or any text outside the JSON.`;

      const result = await agent.generate(prompt, {
         requestContext: createRequestContext({ userId: context.userId }),
      });

      try {
         const parsed = SuggestStructureOutputSchema.parse(
            JSON.parse(result.text),
         );
         return parsed;
      } catch (err) {
         console.error("[clusters] Failed to parse AI response", {
            error: err,
            raw: result.text,
         });
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "AI returned an invalid structure. Please try again.",
         });
      }
   });
