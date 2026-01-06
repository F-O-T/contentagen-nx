import { auth } from "../integrations/auth";
import { db } from "../integrations/database";
import {
	mastra,
	createRequestContext,
	type ChatMode,
	type ModelId,
	type ContentPlan,
} from "@packages/agents";
import {
	addChatMessage,
	getChatSessionWithMessages,
	getOrCreateChatSession,
	clearChatSession,
	getChatSessionById,
} from "@packages/database/repositories/chat-repository";
import type { StoredToolCall } from "@packages/database/schemas/chat";
import { Elysia, t } from "elysia";
import type { CoreMessage } from "@mastra/core/llm";

// Step state for tracking agent execution
interface StepState {
	stepIndex: number;
	text: string;
	toolCalls: StoredToolCall[];
	pendingToolCalls: Map<string, { name: string; args: Record<string, unknown> }>;
	hasToolResult: boolean;
}

export const agentChatRoutes = new Elysia({ prefix: "/api/agent/chat" })
	// Stream chat completion using Mastra blog editor agent
	.post(
		"/stream",
		async function* ({ body, request }) {
			// Validate session
			const session = await auth.api.getSession({ headers: request.headers });
			if (!session) {
				throw new Error("Unauthorized");
			}

			const organizationId = session.session.activeOrganizationId;
			if (!organizationId) {
				throw new Error("No active organization");
			}

			const {
				sessionId,
				messages,
				selectionContext,
				documentContext,
				mode,
				model,
				planContext,
			} = body;

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
				mode: (mode as ChatMode) || "plan",
				model: (model as ModelId) || "x-ai/grok-4.1-fast",
				activePlan: mode === "writer" ? (planContext as ContentPlan) : undefined,
			});

			// Select agent based on mode
			const agentId = mode === "plan" ? "planAgent" : "writerAgent";
			const agent = mastra.getAgent(agentId);

			// Initialize step state for tracking agent execution
			let currentStep: StepState = {
				stepIndex: 0,
				text: "",
				toolCalls: [],
				pendingToolCalls: new Map(),
				hasToolResult: false,
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
						currentStep.toolCalls.length > 0 ? currentStep.toolCalls : undefined,
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
							currentStep.pendingToolCalls.set(chunk.payload.toolCallId, {
								name: chunk.payload.toolName,
								args: chunk.payload.args as Record<string, unknown>,
							});

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
								);

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
				mode: t.Optional(
					t.Union([t.Literal("plan"), t.Literal("writer")]),
				),
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
			const session = await auth.api.getSession({ headers: request.headers });
			if (!session) {
				throw new Error("Unauthorized");
			}

			const organizationId = session.session.activeOrganizationId;
			if (!organizationId) {
				throw new Error("No active organization");
			}

			const chatSession = await getOrCreateChatSession(
				db,
				params.contentId,
				organizationId,
			);

			const sessionWithMessages = await getChatSessionWithMessages(
				db,
				params.contentId,
				organizationId,
			);

			return {
				session: chatSession,
				messages: sessionWithMessages?.messages ?? [],
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
			const session = await auth.api.getSession({ headers: request.headers });
			if (!session) {
				throw new Error("Unauthorized");
			}

			const organizationId = session.session.activeOrganizationId;
			if (!organizationId) {
				throw new Error("No active organization");
			}

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
