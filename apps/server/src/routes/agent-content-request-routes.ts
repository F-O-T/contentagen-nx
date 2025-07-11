import { authMiddleware } from "@api/integrations/auth";
import { and, eq, desc } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { agent as agentTable } from "../schemas/agent-schema";
import { contentRequest } from "../schemas/content-schema";
import { NotFoundError } from "../shared/errors";

export const agentContentRequestRoutes = new Elysia().use(authMiddleware).get(
  "/:id/content-requests",
  async ({ params, user }) => {
    const agent = await db.query.agent.findFirst({
      where: and(eq(agentTable.id, params.id), eq(agentTable.userId, user.id)),
    });
    if (!agent) throw new NotFoundError("Agent not found", "AGENT_NOT_FOUND");
    const requests = await db.query.contentRequest.findMany({
      where: eq(contentRequest.agentId, params.id),
      columns: {
        id: true,
        topic: true,
        briefDescription: true,
        targetLength: true,
        isCompleted: true,
        createdAt: true,
        updatedAt: true,
        agentId: true,
        generatedContentId: true,
      },
      orderBy: desc(contentRequest.createdAt),
    });
    return { requests };
  },
  {
    auth: true,
    params: t.Object({ id: t.String() }),
  },
);
