import { handleChatStream, mastra } from "@packages/agents";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStreamResponse } from "ai";

import { auth } from "@/integrations/orpc/server-instances";

export const Route = createFileRoute("/api/chat/$")({
   server: {
      handlers: {
         POST: async ({ request }) => {
            const session = await auth.api.getSession({
               headers: request.headers,
            });

            if (!session) return new Response("Unauthorized", { status: 401 });

            const teamId = session.session.activeTeamId;
            const userId = session.session.userId;
            const body = await request.json();
            const { messages, threadId } = body;
            const resourceId = `${teamId}:${userId}`;

            if (threadId) {
               const memory = await mastra
                  .getAgent("unifiedContent")
                  .getMemory();
               if (!memory)
                  return new Response("Memory not configured", { status: 500 });
               const thread = await memory.getThreadById({
                  threadId: threadId,
               });
               if (thread?.resourceId !== resourceId) {
                  return new Response("Thread not found or access denied", {
                     status: 403,
                  });
               }
            }

            const stream = await handleChatStream({
               mastra,
               agentId: "content-network-agent",
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
