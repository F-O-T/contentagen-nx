import { mastra, toAISdkStream } from "@packages/agents";
import { createAuth } from "@packages/authentication/server";
import { createDb } from "@packages/database/client";
import { env } from "@packages/environment/server";
import { createFileRoute } from "@tanstack/react-router";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import type { MessageListInput } from "@mastra/core/agent/message-list";
import { z } from "zod";

const db = createDb({ databaseUrl: env.DATABASE_URL });
const auth = createAuth({ db, env });

const chatBodySchema = z.object({
   teamId: z.string().uuid(),
   threadId: z.string().min(1),
   messages: z.array(z.unknown()),
});

export const Route = createFileRoute("/api/chat/$")({
   server: {
      handlers: {
         POST: async ({ request }) => {
            const session = await auth.api.getSession({
               headers: request.headers,
            });
            if (!session) return new Response("Unauthorized", { status: 401 });

            const body = await request.json();
            const parsed = chatBodySchema.safeParse(body);
            if (!parsed.success)
               return new Response("Bad Request", { status: 400 });

            const { messages, threadId, teamId } = parsed.data;
            const resourceId = `${teamId}:${session.user.id}`;

            const agent = mastra.getAgent("unifiedContent");
            const stream = await agent.stream(messages as MessageListInput, {
               memory: { resource: resourceId, thread: threadId },
            });

            const uiMessageStream = createUIMessageStream({
               originalMessages: messages as any,
               execute: async ({ writer }) => {
                  for await (const part of toAISdkStream(stream, {
                     from: "agent",
                  })) {
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
