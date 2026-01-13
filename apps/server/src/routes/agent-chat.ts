import type { CoreMessage } from "@mastra/core/llm";
import {
   type ChatMode,
   type ContentPlan,
   createRequestContext,
   type ModelId,
   mastra,
} from "@packages/agents";
import { getAgentInstructions } from "@packages/database/repositories/agent-instructions-repository";
import {
   addChatMessage,
   clearChatSession,
   getChatSessionById,
   getChatSessionWithMessages,
   getOrCreateChatSession,
   updateChatSessionMode,
} from "@packages/database/repositories/chat-repository";
import { getContentById } from "@packages/database/repositories/content-repository";
import type { StoredToolCall } from "@packages/database/schemas/chat";
import {
   captureChatResponseComplete,
   captureChatToolExecuted,
   capturePlanCreated,
   type LLMCaptureContext,
} from "@packages/posthog/llm/server";
import { Elysia, t } from "elysia";
import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import { posthog } from "../integrations/posthog";
import { Feature, requireFeatureAccess } from "../utils/feature-gate";
import { resolveOrganizationId } from "../utils/resolve-organization";

// Step state for tracking agent execution
interface StepState {
   stepIndex: number;
   text: string;
   toolCalls: StoredToolCall[];
   pendingToolCalls: Map<
      string,
      { name: string; args: Record<string, unknown> }
   >;
   hasToolResult: boolean;
}

export const agentChatRoutes = new Elysia({ prefix: "/api/agent/chat" })
   // Stream chat completion using Mastra blog editor agent
   .post(
      "/stream",
      async function* ({ body, request }) {
         // Validate session
         const session = await auth.api.getSession({
            headers: request.headers,
         });
         if (!session) {
            throw new Error("Unauthorized");
         }

         // Resolve organization from headers (same as tRPC isAuthed middleware)
         const organizationId = await resolveOrganizationId(
            db,
            session.user.id,
            request.headers,
            session.session.activeOrganizationId,
         );
         if (!organizationId) {
            throw new Error("No active organization");
         }

         // Check feature access (Chat requires LITE+ plan)
         await requireFeatureAccess(
            Feature.CHAT,
            organizationId,
            request.headers,
         );

         // Check if plan mode is requested - requires PRO plan
         if (body.mode === "plan") {
            await requireFeatureAccess(
               Feature.CHAT_PLAN_MODE,
               organizationId,
               request.headers,
            );
         }

         const {
            sessionId,
            messages,
            selectionContext,
            documentContext,
            mode,
            model,
            planContext,
            contentId,
         } = body;

         // Get the content to retrieve the agentId for tool context
         const contentRecord = await getContentById(db, contentId);
         if (!contentRecord) {
            throw new Error("Content not found");
         }
         const contentAgentId = contentRecord.agentId;

         // Fetch instruction memories for agent (if agent exists)
         const agentInstructions = contentAgentId
            ? await getAgentInstructions(db, contentAgentId)
            : [];

         // Update session mode when it changes
         if (mode) {
            await updateChatSessionMode(
               db,
               sessionId,
               mode as "plan" | "writer",
            );
         }

         // Save user message to database
         const userMessage = messages[messages.length - 1];
         if (userMessage?.role === "user") {
            // Transform selectionContext to match database type
            const dbSelectionContext = selectionContext
               ? {
                    text: selectionContext.text,
                    contextBefore: selectionContext.contextBefore ?? "",
                    contextAfter: selectionContext.contextAfter ?? "",
                 }
               : undefined;

            await addChatMessage(
               db,
               sessionId,
               "user",
               userMessage.content,
               dbSelectionContext,
               undefined,
               undefined,
               undefined,
               mode as "plan" | "writer" | undefined,
            );
         }

         // Build system message with context
         let systemPrompt = "";
         if (documentContext) {
            systemPrompt += `## DOCUMENT CONTENT\n${documentContext}\n\n`;
         }
         if (selectionContext) {
            systemPrompt += `## CURRENT SELECTION\n`;
            if (selectionContext.contextBefore) {
               systemPrompt += `Context before: ${selectionContext.contextBefore}\n`;
            }
            systemPrompt += `Selected text: ${selectionContext.text}\n`;
            if (selectionContext.contextAfter) {
               systemPrompt += `Context after: ${selectionContext.contextAfter}\n`;
            }
         }

         // Convert messages to Mastra format
         const mastraMessages: CoreMessage[] = messages.map((m) => ({
            role: m.role,
            content: m.content,
         }));

         // Create request context with mode, model, and optional plan
         const requestContext = createRequestContext({
            userId: session.user.id,
            brandId: organizationId,
            agentId: contentAgentId ?? undefined,
            mode: (mode as ChatMode) || "plan",
            model: (model as ModelId) || "x-ai/grok-4.1-fast",
            activePlan:
               mode === "writer" ? (planContext as ContentPlan) : undefined,
            agentInstructions,
         });

         // Select agent based on mode
         const mastraAgentId = mode === "plan" ? "planAgent" : "writerAgent";
         const agent = mastra.getAgent(mastraAgentId);

         // Initialize step state for tracking agent execution
         let currentStep: StepState = {
            stepIndex: 0,
            text: "",
            toolCalls: [],
            pendingToolCalls: new Map(),
            hasToolResult: false,
         };

         // Analytics tracking
         const streamStartTime = Date.now();
         const toolsUsed: string[] = [];
         const toolStartTimes = new Map<string, number>();
         const captureCtx: LLMCaptureContext = {
            posthog,
            userId: session.user.id,
            organizationId,
            hasConsent: session.user.telemetryConsent ?? true,
         };

         // Helper to save current step to database
         const saveCurrentStep = async () => {
            if (currentStep.text || currentStep.toolCalls.length > 0) {
               await addChatMessage(
                  db,
                  sessionId,
                  "assistant",
                  currentStep.text,
                  undefined,
                  currentStep.toolCalls.length > 0
                     ? currentStep.toolCalls
                     : undefined,
                  undefined,
                  undefined,
                  mode as "plan" | "writer" | undefined,
               );
            }
         };

         try {
            // Stream using fullStream for real-time tool events
            const stream = await agent.stream(mastraMessages, {
               requestContext,
               maxSteps: 20,
            });

            // Emit initial step start
            yield JSON.stringify({
               type: "step_start",
               stepIndex: currentStep.stepIndex,
            }) + "\n";

            // Use fullStream to get all events including tool calls in real-time
            for await (const chunk of stream.fullStream) {
               switch (chunk.type) {
                  case "text-delta": {
                     // Detect new step: text after tool result = new thinking step
                     if (currentStep.hasToolResult && currentStep.text) {
                        // Save current step to DB
                        await saveCurrentStep();

                        yield JSON.stringify({
                           type: "step_complete",
                           stepIndex: currentStep.stepIndex,
                        }) + "\n";

                        // Reset for new step
                        currentStep = {
                           stepIndex: currentStep.stepIndex + 1,
                           text: "",
                           toolCalls: [],
                           pendingToolCalls: new Map(),
                           hasToolResult: false,
                        };

                        yield JSON.stringify({
                           type: "step_start",
                           stepIndex: currentStep.stepIndex,
                        }) + "\n";
                     }

                     // Accumulate text for current step
                     currentStep.text += chunk.payload.text;
                     yield JSON.stringify({
                        type: "text",
                        text: chunk.payload.text,
                        stepIndex: currentStep.stepIndex,
                        done: false,
                     }) + "\n";
                     break;
                  }

                  case "tool-call": {
                     // Store pending tool call to get name/args when result arrives
                     currentStep.pendingToolCalls.set(
                        chunk.payload.toolCallId,
                        {
                           name: chunk.payload.toolName,
                           args: chunk.payload.args as Record<string, unknown>,
                        },
                     );

                     // Track tool start time for analytics
                     toolStartTimes.set(chunk.payload.toolCallId, Date.now());
                     toolsUsed.push(chunk.payload.toolName);

                     // Emit tool call start for real-time UI
                     yield JSON.stringify({
                        type: "tool_call_start",
                        toolCall: {
                           id: chunk.payload.toolCallId,
                           name: chunk.payload.toolName,
                           args: chunk.payload.args,
                        },
                        stepIndex: currentStep.stepIndex,
                     }) + "\n";
                     break;
                  }

                  case "tool-result": {
                     currentStep.hasToolResult = true;

                     // Get the pending tool call info
                     const pendingTool = currentStep.pendingToolCalls.get(
                        chunk.payload.toolCallId,
                     );

                     // Add completed tool call to current step
                     currentStep.toolCalls.push({
                        id: chunk.payload.toolCallId,
                        name: pendingTool?.name ?? "unknown",
                        args: pendingTool?.args ?? {},
                        result: chunk.payload.result,
                        status: "completed",
                        executedAt: Date.now(),
                     });

                     // Capture tool execution analytics
                     const toolStartTime = toolStartTimes.get(
                        chunk.payload.toolCallId,
                     );
                     const toolResult = chunk.payload.result as Record<
                        string,
                        unknown
                     > | null;
                     captureChatToolExecuted(captureCtx, {
                        contentId,
                        sessionId,
                        toolName: pendingTool?.name ?? "unknown",
                        durationMs: toolStartTime
                           ? Date.now() - toolStartTime
                           : 0,
                        success: toolResult?.status !== "error",
                        model,
                     });

                     // Check for workflow suspension
                     const result = chunk.payload.result as Record<
                        string,
                        unknown
                     >;
                     if (result?.status === "suspended" && result?.runId) {
                        // Emit workflow_suspended event for frontend
                        yield JSON.stringify({
                           type: "workflow_suspended",
                           workflowTool: pendingTool?.name,
                           runId: result.runId,
                           suspendedAt: result.suspendedAt,
                           suspendData: result.suspendData,
                           message: result.message,
                           stepIndex: currentStep.stepIndex,
                        }) + "\n";
                     }

                     // Special handling for createPlan tool - save as plan message
                     if (pendingTool?.name === "createPlan") {
                        const planResult = chunk.payload.result as {
                           summary: string;
                           steps: Array<{
                              id: string;
                              title: string;
                              description: string;
                              toolsToUse?: string[];
                              rationale?: string;
                           }>;
                        };

                        // Save plan message to database
                        await addChatMessage(
                           db,
                           sessionId,
                           "assistant",
                           planResult.summary,
                           undefined,
                           undefined,
                           "plan",
                           planResult.steps.map((step) => ({
                              id: step.id,
                              title: step.title,
                              description: step.description,
                              toolsToUse: step.toolsToUse,
                              rationale: step.rationale,
                              status: "pending" as const,
                           })),
                           mode as "plan" | "writer" | undefined,
                        );

                        // Capture plan creation analytics
                        capturePlanCreated(captureCtx, {
                           contentId,
                           sessionId,
                           stepCount: planResult.steps.length,
                           researchToolsUsed: toolsUsed.filter((t) =>
                              [
                                 "webSearch",
                                 "webCrawl",
                                 "serpAnalysis",
                                 "competitorContent",
                                 "relatedKeywords",
                                 "contentGapFinder",
                                 "factFinder",
                              ].includes(t),
                           ),
                           hasResearchInsights: false, // Will be added when we have the data
                           model,
                        });

                        // Emit plan_created event for frontend
                        yield JSON.stringify({
                           type: "plan_created",
                           plan: planResult,
                           stepIndex: currentStep.stepIndex,
                        }) + "\n";
                     }

                     // Emit tool call complete
                     yield JSON.stringify({
                        type: "tool_call_complete",
                        toolCallId: chunk.payload.toolCallId,
                        result: chunk.payload.result,
                        stepIndex: currentStep.stepIndex,
                     }) + "\n";
                     break;
                  }
               }
            }

            // Save final step if it has content
            await saveCurrentStep();

            // Get token usage from the stream
            const usage = await stream.usage;

            // Capture response completion analytics
            captureChatResponseComplete(captureCtx, {
               contentId,
               sessionId,
               mode: (mode as "plan" | "writer") ?? "plan",
               durationMs: Date.now() - streamStartTime,
               stepCount: currentStep.stepIndex + 1,
               toolsUsed: [...new Set(toolsUsed)], // Deduplicate
               messageLength: currentStep.text.length,
               model,
               inputTokens: usage?.inputTokens ?? 0,
               outputTokens: usage?.outputTokens ?? 0,
               totalTokens: usage?.totalTokens ?? 0,
            });

            // Final step complete and done signal
            yield JSON.stringify({
               type: "step_complete",
               stepIndex: currentStep.stepIndex,
            }) + "\n";

            yield JSON.stringify({ type: "done" }) + "\n";
         } catch (error) {
            yield JSON.stringify({
               type: "error",
               error: (error as Error).message,
               stepIndex: currentStep.stepIndex,
            }) + "\n";
         }
      },
      {
         body: t.Object({
            sessionId: t.String(),
            contentId: t.String(),
            messages: t.Array(
               t.Object({
                  role: t.Union([t.Literal("user"), t.Literal("assistant")]),
                  content: t.String(),
               }),
            ),
            selectionContext: t.Optional(
               t.Object({
                  text: t.String(),
                  contextBefore: t.Optional(t.String()),
                  contextAfter: t.Optional(t.String()),
               }),
            ),
            documentContext: t.Optional(t.String()),
            mode: t.Optional(t.Union([t.Literal("plan"), t.Literal("writer")])),
            model: t.Optional(t.String()),
            maxTokens: t.Optional(t.Number()),
            temperature: t.Optional(t.Number()),
            planContext: t.Optional(
               t.Object({
                  summary: t.String(),
                  steps: t.Array(
                     t.Object({
                        id: t.String(),
                        title: t.String(),
                        description: t.String(),
                        toolsToUse: t.Optional(t.Array(t.String())),
                        rationale: t.Optional(t.String()),
                     }),
                  ),
                  researchInsights: t.Optional(
                     t.Object({
                        serpIntent: t.Optional(t.String()),
                        topRankingTopics: t.Optional(t.Array(t.String())),
                        competitorStrengths: t.Optional(t.Array(t.String())),
                        contentGaps: t.Optional(t.Array(t.String())),
                        suggestedKeywords: t.Optional(t.Array(t.String())),
                     }),
                  ),
                  estimatedWordCount: t.Optional(t.Number()),
                  targetKeywords: t.Optional(t.Array(t.String())),
                  suggestedTitle: t.Optional(t.String()),
                  suggestedDescription: t.Optional(t.String()),
               }),
            ),
         }),
      },
   )

   // Get or create session for a content document
   .get(
      "/session/:contentId",
      async ({ params, request }) => {
         const session = await auth.api.getSession({
            headers: request.headers,
         });
         if (!session) {
            throw new Error("Unauthorized");
         }

         // Resolve organization from headers (same as tRPC isAuthed middleware)
         const organizationId = await resolveOrganizationId(
            db,
            session.user.id,
            request.headers,
            session.session.activeOrganizationId,
         );
         if (!organizationId) {
            throw new Error("No active organization");
         }

         // Check feature access (Chat requires PRO plan)
         await requireFeatureAccess(
            Feature.CHAT,
            organizationId,
            request.headers,
         );

         const chatSession = await getOrCreateChatSession(
            db,
            params.contentId,
            organizationId,
         );

         if (!chatSession) {
            throw new Error("Failed to get or create chat session");
         }

         const sessionWithMessages = await getChatSessionWithMessages(
            db,
            params.contentId,
            organizationId,
         );

         return {
            session: chatSession,
            messages: sessionWithMessages?.messages ?? [],
            mode: chatSession.mode ?? "plan",
         };
      },
      {
         params: t.Object({
            contentId: t.String(),
         }),
      },
   )

   // Clear all messages in a session
   .delete(
      "/session/:sessionId",
      async ({ params, request }) => {
         const session = await auth.api.getSession({
            headers: request.headers,
         });
         if (!session) {
            throw new Error("Unauthorized");
         }

         // Resolve organization from headers (same as tRPC isAuthed middleware)
         const organizationId = await resolveOrganizationId(
            db,
            session.user.id,
            request.headers,
            session.session.activeOrganizationId,
         );
         if (!organizationId) {
            throw new Error("No active organization");
         }

         // Check feature access (Chat requires PRO plan)
         await requireFeatureAccess(
            Feature.CHAT,
            organizationId,
            request.headers,
         );

         const chatSession = await getChatSessionById(db, params.sessionId);
         if (!chatSession || chatSession.organizationId !== organizationId) {
            throw new Error("Session not found");
         }

         await clearChatSession(db, params.sessionId);

         return { success: true };
      },
      {
         params: t.Object({
            sessionId: t.String(),
         }),
      },
   );
