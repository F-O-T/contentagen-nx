import { mastra, toAISdkStream } from "@packages/agents";
import { createAuth } from "@packages/authentication/server";
import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/server";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";

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

            const { messages, threadId, teamId } = await request.json();
            const resourceId = `${teamId}:${session.user.id}`;

            const agent = mastra.getAgent("unifiedContent");
            const stream = await agent.stream(messages, {
               memory: { resource: resourceId, thread: threadId },
            });

            const uiMessageStream = createUIMessageStream({
               originalMessages: messages,
               execute: async ({ writer }) => {
                  for await (const part of toAISdkStream(stream, { from: "agent" })) {
                     await writer.write(part);
                  }
               },
            });

            return createUIMessageStreamResponse({
               stream: uiMessageStream,
            });
         },
      },
   },
});
