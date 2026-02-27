import { handleChatStream, mastra } from "@packages/agents";
import { createFileRoute } from "@tanstack/react-router";
import type { ModelMessage } from "ai";
import { createUIMessageStreamResponse } from "ai";

import { auth } from "@/integrations/orpc/server-instances";

const MODE_ROUTING_PREFIX: Record<string, string> = {
   auto: "",
   content: "[Usar content-agent]:",
};

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
            const { messages, threadId, mode = "auto" } = body;
            const resourceId = `${teamId}:${userId}`;

            const prefix = MODE_ROUTING_PREFIX[mode] ?? "";
            const processedMessages = prefix
               ? messages.map((msg: ModelMessage, idx: number) => {
                    if (idx === messages.length - 1 && msg.role === "user") {
                       const content =
                          typeof msg.content === "string"
                             ? `${prefix} ${msg.content}`
                             : msg.content;
                       return { ...msg, content };
                    }
                    return msg;
                 })
               : messages;

            if (threadId) {
               const memory = await mastra
                  .getAgent("platformRouterAgent")
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
               agentId: "platformRouterAgent",
               params: {
                  messages: processedMessages,
                  memory: { resource: resourceId, thread: threadId },
               },
            });

            return createUIMessageStreamResponse({ stream });
         },
      },
   },
});
