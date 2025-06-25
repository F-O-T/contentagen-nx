import { authMiddleware } from "@api/integrations/auth";
import { eq, and } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable } from "../schemas/content-schema";
import { NotFoundError } from "../shared/errors";

const _createAgent = createInsertSchema(agentTable);

export const agentRoutes = new Elysia({
  prefix: "/agents",
})
  .use(authMiddleware)
  .post(
    "/",
    async ({ body, user }) => {
      const agent = await db
        .insert(agentTable)
        .values({
          ...body,
          userId: user.id,
        })
        .returning();
      return { agent };
    },
    {
      auth: true,
      body: t.Omit(_createAgent, ["id", "createdAt", "updatedAt", "userId"]),
    },
  )
  .patch(
    "/:id",
    async ({ params, body, user }) => {
      const updated = await db
        .update(agentTable)
        .set(body)
        .where(and(eq(agentTable.id, params.id), eq(agentTable.userId, user.id)))
        .returning();
      if (!updated.length) {
        throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
      }
      return { agent: updated[0] };
    },
    {
      auth: true,
      params: t.Object({ id: t.String() }),
      body: t.Partial(t.Omit(_createAgent, ["id", "createdAt", "updatedAt", "userId"])),
    },
  )
  .get("/", async ({ user }) => {
    const agents = await db.query.agent.findMany({
      where: eq(agentTable.userId, user.id),
      with: {
        project: true,
      },
    });
    return { agents };
  },{
  auth: true,
  })
  .get(
    "/:id",
    async ({ params, user }) => {
      const agent = await db.query.agent.findFirst({
        where: and(eq(agentTable.id, params.id), eq(agentTable.userId, user.id)),
        with: {
          project: true,
        },
      });
      if (!agent) {
        throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
      }
      return { agent };
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .delete(
    "/:id",
    async ({ params, user }) => {
      const deleted = await db
        .delete(agentTable)
        .where(and(eq(agentTable.id, params.id), eq(agentTable.userId, user.id)))
        .returning();
      if (!deleted.length) {
        throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
      }
      return new Response(null, { status: 204 });
    },
    {
      auth: true,
      params: t.Object({
        id: t.String(),
      }),
    },
  );
