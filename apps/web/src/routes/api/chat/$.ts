import { createRequestContext, handleChatStream, handleWorkflowStream, mastra } from "@packages/agents";
import type { RequestContext } from "@packages/agents";
import { getContentById, updateContent } from "@packages/database/repositories/content-repository";
import { getWriterInstructions } from "@packages/database/repositories/writer-instructions-repository";
import type { ContentMeta } from "@packages/database/schemas/content";
import { AI_EVENTS, emitAiChatMessage } from "@packages/events/ai";
import { enforceCreditBudget, trackCreditUsage } from "@packages/events/credits";
import { createEmitFn } from "@packages/events/emit";
import { createFileRoute } from "@tanstack/react-router";
import type { ModelMessage } from "ai";
import { createUIMessageStreamResponse } from "ai";

import type { Value } from "platejs";

import { markdownToPlateValue, plateValueToMarkdown } from "@/features/editor/utils/markdown-to-plate";
import { auth, db } from "@/integrations/orpc/server-instances";


async function loadContentContext(
   dbClient: typeof db,
   contentId: string,
) {
   const contentRecord = await getContentById(dbClient, contentId);
   const writerId = contentRecord?.writerId ?? undefined;
   const writerInstructions = writerId
      ? await getWriterInstructions(dbClient, writerId)
      : undefined;

   // Extract editor context for <context_atual> block
   const meta = contentRecord?.meta as Record<string, unknown> | null | undefined;
   const contentTitle = typeof meta?.title === "string" ? meta.title : undefined;
   const contentKeywords = Array.isArray(meta?.keywords) ? (meta.keywords as string[]) : undefined;
   const contentStatus = contentRecord?.status ?? undefined;

   return { contentId, writerId, writerInstructions, contentTitle, contentKeywords, contentStatus };
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
            const organizationId = session.session.activeOrganizationId ?? undefined;
            const body = await request.json();
            const { messages, threadId, mode = "platform", contextId, workflow, model, thinkingBudget } = body;
            const resourceId = `${teamId}:${userId}`;

            // Credit enforcement — block if AI budget exhausted
            if (organizationId) {
               try {
                  await enforceCreditBudget(db, organizationId, "ai");
               } catch {
                  return new Response(
                     "Crédito de IA esgotado. Faça upgrade do seu plano para continuar.",
                     { status: 402 },
                  );
               }
            }

            let bodyAccumulator = "";
            let metaAccumulator: Partial<ContentMeta> = {};

            // Guard: verify contextId belongs to the session's active team
            if (contextId) {
               const contentRecord = await getContentById(db, contextId);
               if (!contentRecord || contentRecord.teamId !== teamId) {
                  return new Response("Content not found or access denied", {
                     status: 403,
                  });
               }
               // Seed meta accumulator with existing values so partial tool calls
               // (e.g. editTitle only) don't wipe description/slug/keywords.
               if (contentRecord.meta) {
                  Object.assign(metaAccumulator, contentRecord.meta);
               }
            }

            function extractMarkdown(
               _toolName: string,
               output: Record<string, unknown>,
            ): string {
               const md = output.markdown as string | undefined;
               if (!md) return "";
               return `\n\n${md.trim()}`;
            }

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

            const getContentBody = contextId
               ? async () => {
                    try {
                       const record = await getContentById(db, contextId);
                       if (!record?.body) return null;
                       const nodes = JSON.parse(record.body) as Value;
                       const markdown = plateValueToMarkdown(nodes);
                       const wordCount = markdown.split(/\s+/).filter(Boolean).length;
                       return { markdown, wordCount };
                    } catch {
                       return null;
                    }
                 }
               : undefined;

            function filterDataStreamParts() {
               return new TransformStream({
                  transform(chunk, controller) {
                     const type = (chunk as { type?: string }).type;
                     // Block all data-* parts — @assistant-ui/react v0.12.x does not
                     // register the `dataRenderers` scope, so any data part crashes
                     // the client regardless of its specific type.
                     // Log them so we can eventually build proper UI renderers.
                     if (typeof type === "string" && type.startsWith("data-")) {
                        console.log("[data-stream] filtered part:", type, chunk);
                        return;
                     }
                     controller.enqueue(chunk);
                  },
               });
            }

            if (threadId) {
               const memory = await mastra
                  .getAgent("tecoAgent")
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
                        teamId: teamId ?? undefined,
                        organizationId,
                        db,
                        mode,
                        ...contentCtx,
                        onBodyUpdate,
                        onMetaUpdate,
                     }) as RequestContext,
                  },
               });

               const filteredWorkflowStream = workflowStream.pipeThrough(filterDataStreamParts());

               // Fire-and-forget: emit ai.chat_message event and track credit usage
               if (organizationId) {
                  const chatId = threadId ?? crypto.randomUUID();
                  void emitAiChatMessage(
                     createEmitFn(db),
                     { organizationId, userId, teamId: teamId ?? undefined },
                     {
                        chatId,
                        contentId: contextId ?? undefined,
                        model: typeof model === "string" ? model : "openrouter/default",
                        provider: "openrouter",
                        role: "assistant",
                        promptTokens: 0,
                        completionTokens: 0,
                        totalTokens: 0,
                        latencyMs: 0,
                     },
                  );
                  void trackCreditUsage(db, AI_EVENTS["ai.chat_message"], organizationId, "ai");
               }

               return createUIMessageStreamResponse({ stream: filteredWorkflowStream });
            }
            // ── End workflow path ───────────────────────────────────────────────────────

            const stream = await handleChatStream({
               mastra,
               agentId: "tecoAgent",
               params: {
                  messages,
                  memory: { resource: resourceId, thread: threadId },
                  requestContext: createRequestContext({
                     userId,
                     teamId: teamId ?? undefined,
                     organizationId,
                     db,
                     mode,
                     ...(model ? { model } : {}),
                     ...(thinkingBudget ? { thinkingBudget } : {}),
                     ...(contextId
                        ? {
                             ...(await loadContentContext(db, contextId)),
                             onBodyUpdate,
                             onMetaUpdate,
                             getContentBody,
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

            // Fire-and-forget: emit ai.chat_message event and track credit usage
            if (organizationId) {
               const chatId = threadId ?? crypto.randomUUID();
               void emitAiChatMessage(
                  createEmitFn(db),
                  { organizationId, userId, teamId: teamId ?? undefined },
                  {
                     chatId,
                     contentId: contextId ?? undefined,
                     model: typeof model === "string" ? model : "openrouter/default",
                     provider: "openrouter",
                     role: "assistant",
                     promptTokens: 0,
                     completionTokens: 0,
                     totalTokens: 0,
                     latencyMs: 0,
                  },
               );
               void trackCreditUsage(db, AI_EVENTS["ai.chat_message"], organizationId, "ai");
            }

            return createUIMessageStreamResponse({ stream: filteredStream });
         },
      },
   },
});
