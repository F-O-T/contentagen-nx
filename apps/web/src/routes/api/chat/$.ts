import { handleChatStream, mastra } from "@packages/agents";
import { createAuth } from "@packages/authentication/server";
import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/server";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStreamResponse } from "ai";

const db = createDb({ databaseUrl: env.DATABASE_URL });
const auth = createAuth({ db, env });

export const Route = createFileRoute("/api/chat/$")({
   server: {
      handlers: {
         POST: async ({ request }) => {
            const session = await auth.api.getSession({
               headers: request.headers,
            });
            if (!session) return new Response("Unauthorized", { status: 401 });

            const body = await request.json();
            const { messages, teamId } = body;
            // Support both `threadId` (context panel) and `id` (full chat page via AssistantChatTransport)
            const threadId: string =
               body.threadId ?? body.id ?? crypto.randomUUID();
            const resourceId = `${teamId}:${session.user.id}`;

            const stream = await handleChatStream({
               mastra,
               agentId: "unifiedContent",
               params: {
                  messages,
                  memory: { resource: resourceId, thread: threadId },
               },
            });

            return createUIMessageStreamResponse({ stream });
         },
      },
   },
});
