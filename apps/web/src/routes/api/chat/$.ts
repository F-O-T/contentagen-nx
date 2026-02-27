import { createRequestContext, handleChatStream, handleWorkflowStream, mastra } from "@packages/agents";
import type { RequestContext } from "@packages/agents";
import { getContentById, updateContent } from "@packages/database/repositories/content-repository";
import { getWriterInstructions } from "@packages/database/repositories/writer-instructions-repository";
import type { ContentMeta } from "@packages/database/schemas/content";
import { createFileRoute } from "@tanstack/react-router";
import type { ModelMessage } from "ai";
import { createUIMessageStreamResponse } from "ai";

import { markdownToPlateValue } from "@/features/editor/utils/markdown-to-plate";
import { auth, db } from "@/integrations/orpc/server-instances";

const ROUTER_PREFIX_MAP: Record<string, string> = {
   auto: "",
   content: "[Usar content-agent]:",
};

async function loadContentContext(
   dbClient: typeof db,
   contentId: string,
) {
   const contentRecord = await getContentById(dbClient, contentId);
   const writerId = contentRecord?.writerId ?? undefined;
   const writerInstructions = writerId
      ? await getWriterInstructions(dbClient, writerId)
      : undefined;
   return { contentId, writerId, writerInstructions };
}

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
            const { messages, threadId, router = "auto", contextId, workflow } = body;
            const resourceId = `${teamId}:${userId}`;

            function extractMarkdown(
               _toolName: string,
               output: Record<string, unknown>,
            ): string {
               const md = output.markdown as string | undefined;
               if (!md) return "";
               return `\n\n${md.trim()}`;
            }

            let bodyAccumulator = "";
            let metaAccumulator: Partial<ContentMeta> = {};

            const onBodyUpdate = contextId
               ? async (toolName: string, output: Record<string, unknown>) => {
                    const chunk = extractMarkdown(toolName, output);
                    if (!chunk) return;
                    bodyAccumulator += chunk;
                    try {
                       const plateValue = markdownToPlateValue(
                          bodyAccumulator.trim(),
                       );
                       await updateContent(db, contextId, {
                          body: JSON.stringify(plateValue),
                       });
                    } catch {
                       // best-effort — don't crash the stream if DB write fails
                    }
                 }
               : undefined;

            const onMetaUpdate = contextId
               ? async (patch: Record<string, unknown>) => {
                    Object.assign(metaAccumulator, patch);
                    try {
                       await updateContent(db, contextId, {
                          meta: metaAccumulator as ContentMeta,
                       });
                    } catch {
                       // best-effort
                    }
                 }
               : undefined;

            // If contextId present, always route to content-agent
            const effectiveRouter = contextId ? "content" : router;

            function filterDataStreamParts() {
               return new TransformStream({
                  transform(chunk, controller) {
                     const type = (chunk as { type?: string }).type;
                     if (typeof type === "string" && type.startsWith("data-")) return;
                     controller.enqueue(chunk);
                  },
               });
            }

            const prefix = ROUTER_PREFIX_MAP[effectiveRouter] ?? "";
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

            // ── Workflow path ──────────────────────────────────────────────────────────
            if (workflow === "content-creation" && contextId) {
               const lastUserMessage = [...messages]
                  .reverse()
                  .find((m: ModelMessage) => m.role === "user");
               const topic =
                  typeof lastUserMessage?.content === "string"
                     ? lastUserMessage.content
                     : "Untitled article";

               const contentCtx = await loadContentContext(db, contextId);

               const workflowStream = await handleWorkflowStream({
                  mastra,
                  workflowId: "content-creation",
                  params: {
                     inputData: { topic },
                     requestContext: createRequestContext({
                        userId,
                        ...contentCtx,
                        onBodyUpdate,
                        onMetaUpdate,
                     }) as RequestContext,
                  },
               });

               const filteredWorkflowStream = workflowStream.pipeThrough(filterDataStreamParts());

               return createUIMessageStreamResponse({ stream: filteredWorkflowStream });
            }
            // ── End workflow path ───────────────────────────────────────────────────────

            const stream = await handleChatStream({
               mastra,
               agentId: "platformRouterAgent",
               params: {
                  messages: processedMessages,
                  memory: { resource: resourceId, thread: threadId },
                  requestContext: createRequestContext({
                     userId,
                     ...(contextId
                        ? {
                             ...(await loadContentContext(db, contextId)),
                             onBodyUpdate,
                             onMetaUpdate,
                          }
                        : {}),
                  }),
               },
            });

            // Filter out Mastra-internal data-* stream parts (e.g. data-tripwire,
            // data-tool-call-approval). @assistant-ui/react v0.12.x initialises the
            // `tools` scope in RuntimeAdapter but NOT `dataRenderers`, so any data
            // message part causes a "scope does not have dataRenderers" crash.
            const filteredStream = stream.pipeThrough(filterDataStreamParts());

            return createUIMessageStreamResponse({ stream: filteredStream });
         },
      },
   },
});
