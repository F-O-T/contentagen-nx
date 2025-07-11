import { authMiddleware } from "@api/integrations/auth";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable } from "../schemas/agent-schema";
import { NotFoundError } from "../shared/errors";
import { generateDefaultBasePrompt } from "../services/agent-prompt";
import { handleAgentSlots } from "@api/modules/billing/billing-service";

const _createAgent = createInsertSchema(agentTable);

export const agentCrudRoutes = new Elysia()
   .use(authMiddleware)
   .post(
      "/",
      async ({ body, set, user, request }) => {
         const agentConfig = {
            ...body,
            description: body.description ?? null,
            formattingStyle: body.formattingStyle ?? "structured",
            isActive: body.isActive ?? true,
            totalDrafts: body.totalDrafts ?? 0,
            totalPublished: body.totalPublished ?? 0,
            lastGeneratedAt: body.lastGeneratedAt ?? null,
            communicationStyle: body.communicationStyle ?? "first_person",
            brandIntegration: body.brandIntegration ?? "strict_guideline",
            id: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: user.id,
            basePrompt: null,
            uploadedFiles: [],
         };
         const basePrompt = generateDefaultBasePrompt(agentConfig);
         try {
            await handleAgentSlots(request.headers);
         } catch (error) {
            console.error("Error handling agent slots:", error);
            set.status = 402;
            return "Agent slots limit reached. Please upgrade your plan.";
         }
         const agent = await db
            .insert(agentTable)
            .values({
               ...body,
               basePrompt,
               userId: user.id,
            })
            .returning();
         return { agent };
      },
      {
         auth: true,
         body: t.Omit(_createAgent, [
            "id",
            "createdAt",
            "updatedAt",
            "userId",
            "basePrompt",
         ]),
      },
   )
   .patch(
      "/:id",
      async ({ params, body, user }) => {
         const agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         const updatedAgentConfig = {
            ...agent,
            ...body,
            description: body.description ?? agent.description ?? "",
            formattingStyle:
               body.formattingStyle ?? agent.formattingStyle ?? "structured",
            contentType: body.contentType ?? agent.contentType ?? "blog_posts",
            name: body.name ?? agent.name ?? "Agent",
            createdAt: agent.createdAt ?? new Date(),
            targetAudience:
               body.targetAudience ?? agent.targetAudience ?? "general_public",
            voiceTone: body.voiceTone ?? agent.voiceTone ?? "professional",
            language: body.language ?? agent.language ?? "english",
            brandIntegration:
               body.brandIntegration ??
               agent.brandIntegration ??
               "strict_guideline",
            communicationStyle:
               body.communicationStyle ??
               agent.communicationStyle ??
               "first_person",
            isActive: body.isActive ?? agent.isActive ?? true,
            totalDrafts: body.totalDrafts ?? agent.totalDrafts ?? 0,
            totalPublished: body.totalPublished ?? agent.totalPublished ?? 0,
            lastGeneratedAt:
               body.lastGeneratedAt ?? agent.lastGeneratedAt ?? null,
            updatedAt: new Date(),
            userId: agent.userId,
            uploadedFiles: body.uploadedFiles ?? agent.uploadedFiles ?? [],
            basePrompt: null,
            id: agent.id,
         };
         const basePrompt = generateDefaultBasePrompt(updatedAgentConfig);
         const [updated] = await db
            .update(agentTable)
            .set({ ...body, basePrompt, updatedAt: new Date() })
            .where(
               and(
                  eq(agentTable.id, params.id),
                  eq(agentTable.userId, user.id),
               ),
            )
            .returning();
         if (!updated)
            throw new NotFoundError(
               "Agent not found after update",
               "AGENT_NOT_FOUND",
            );
         return { agent: updated };
      },
      {
         auth: true,
         body: t.Partial(
            t.Omit(_createAgent, ["id", "createdAt", "updatedAt", "userId"]),
         ),
         params: t.Object({ id: t.String() }),
      },
   )
   .get(
      "/",
      async ({ user }) => {
         const agents = await db.query.agent.findMany({
            where: eq(agentTable.userId, user.id),
         });
         return { agents };
      },
      { auth: true },
   )
   .get(
      "/:id",
      async ({ params, user }) => {
         let agent = await db.query.agent.findFirst({
            where: and(
               eq(agentTable.id, params.id),
               eq(agentTable.userId, user.id),
            ),
         });
         if (!agent)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         if (!agent.basePrompt) {
            const basePrompt = generateDefaultBasePrompt({
               ...agent,
               description: agent.description ?? null,
               formattingStyle: agent.formattingStyle ?? "structured",
            });
            await db
               .update(agentTable)
               .set({ basePrompt })
               .where(eq(agentTable.id, params.id))
               .returning();
            agent = { ...agent, basePrompt };
         }
         return { agent };
      },
      { auth: true, params: t.Object({ id: t.String() }) },
   )
   .delete(
      "/:id",
      async ({ params, user }) => {
         const deleted = await db
            .delete(agentTable)
            .where(
               and(
                  eq(agentTable.id, params.id),
                  eq(agentTable.userId, user.id),
               ),
            )
            .returning();
         if (!deleted.length)
            throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
         return new Response(null, { status: 204 });
      },
      { auth: true, params: t.Object({ id: t.String() }) },
   );
