import { authMiddleware } from "@api/integrations/auth";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable } from "../schemas/content-schema";

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
    async ({ params, body }) => {
      const agent = await db
        .update(agentTable)
        .set(body)
        .where(eq(agentTable.id, params.id))
        .returning();
      return { agent };
    },
    {
      body: t.Omit(_createAgent, ["id", "createdAt", "updatedAt", "userId"]),
    },
  )
  .get("/", async () => {
    return await db.query.agent.findMany({
      with: {
        project: true,
      },
    });
  })
  .get(
    "/:id",
    async ({ params }) => {
      const agent = await db.query.agent.findFirst({
        where: eq(agentTable.id, params.id),
      });
      return { agent };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
