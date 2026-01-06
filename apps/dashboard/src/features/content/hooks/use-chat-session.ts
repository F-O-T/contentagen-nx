import { useCallback, useEffect } from "react";
import { clientEnv } from "@packages/environment/client";
import {
	useChatContext,
	getChatState,
	initializeChatSession,
	addUserMessage,
	setChatError,
	clearChat,
	setLoading,
	addPlanMessage,
	type ChatMessage,
	type ToolCallStatus,
	type ActivePlan,
	// Step actions
	startStreamingWithSteps,
	startNewStep,
	appendToCurrentStep,
	addToolCallToCurrentStep,
	updateToolCallInStep,
	completeCurrentStep,
	finalizeStreaming,
} from "../context/chat-context";
import { useAgentChat, type AgentChatRequest } from "./use-agent-chat";

interface ChatSessionResponse {
	session: {
		id: string;
		contentId: string;
		organizationId: string;
	};
	messages: Array<{
		id: string;
		role: "user" | "assistant";
		content: string;
		createdAt: string;
		messageType?: "text" | "plan" | "tool-use";
		selectionContext?: {
			text: string;
			contextBefore: string;
			contextAfter: string;
		};
		toolCalls?: Array<{
			id: string;
			name: string;
			args: Record<string, unknown>;
			result?: unknown;
			status: string;
		}>;
		planSteps?: Array<{
			id: string;
			title: string;
			description?: string;
			toolsToUse?: string[];
			rationale?: string;
			status: "pending" | "approved" | "skipped" | "completed";
		}>;
	}>;
}

interface UseChatSessionOptions {
	onAgentComplete?: () => void;
}

export function useChatSession(contentId: string, options?: UseChatSessionOptions) {
	const { onAgentComplete } = options ?? {};

	const {
		phase,
		model,
		isOpen,
		sessionId,
		messages,
		currentStreamingMessage,
		activeToolCalls,
		selectionContext,
		error,
		editor,
		streamingSteps,
	} = useChatContext();

	// Agent chat hook with step-based streaming support
	const { sendMessage: sendAgentMessage, cancelChat, isLoading } = useAgentChat({
		editor,
		onStepStart: (stepIndex) => {
			startNewStep(stepIndex);
		},
		onChunk: (text, _stepIndex) => {
			appendToCurrentStep(text);
		},
		onStepComplete: (_stepIndex) => {
			completeCurrentStep();
		},
		onComplete: () => {
			finalizeStreaming();
			// Notify parent that agent completed - triggers content save flush
			onAgentComplete?.();
		},
		onError: (error) => {
			setChatError(error);
		},
		onToolCallStart: (toolCall, _stepIndex) => {
			addToolCallToCurrentStep(toolCall);
			updateToolCallInStep(toolCall.id, "executing" as ToolCallStatus);
		},
		onToolCallComplete: (toolCall, result, _stepIndex) => {
			updateToolCallInStep(
				toolCall.id,
				result.success ? ("completed" as ToolCallStatus) : ("error" as ToolCallStatus),
				result.data,
				result.success ? undefined : result.message,
			);
		},
		onPlanCreated: (plan) => {
			// Finalize streaming first to add tool call messages in order
			finalizeStreaming();
			// Add plan message to chat - this triggers the ChatPlanMessage UI
			addPlanMessage(plan.summary, plan.steps);
		},
	});

	// Load session on mount or when contentId changes
	useEffect(() => {
		if (!contentId) return;

		const loadSession = async () => {
			setLoading();
			try {
				const response = await fetch(
					`${clientEnv.VITE_SERVER_URL}/api/agent/chat/session/${contentId}`,
					{
						credentials: "include",
					},
				);

				if (!response.ok) {
					throw new Error(`Failed to load chat session: ${response.status}`);
				}

				const data: ChatSessionResponse = await response.json();

				// Transform messages to our format (including tool calls and plan steps from history)
				const transformedMessages: ChatMessage[] = data.messages.map((m) => {
					// Determine message type
					let type: "text" | "plan" | "tool-use" | "edit-suggestion" = "text";
					if (m.messageType === "plan" || (m.planSteps && m.planSteps.length > 0)) {
						type = "plan";
					} else if (m.toolCalls && m.toolCalls.length > 0) {
						type = "tool-use";
					}

					return {
						id: m.id,
						role: m.role,
						content: m.content,
						timestamp: new Date(m.createdAt).getTime(),
						selectionContext: m.selectionContext,
						type,
						toolCalls: m.toolCalls?.map((tc) => ({
							id: tc.id,
							name: tc.name,
							args: tc.args,
							result: tc.result,
							status: tc.status as "pending" | "executing" | "completed" | "error",
						})),
						// Convert plan steps to the format expected by ChatPlanMessage
						planSteps: m.planSteps?.map((step) => ({
							id: step.id,
							step: step.title,
							description: step.description,
							toolsToUse: step.toolsToUse,
							rationale: step.rationale,
							status: step.status,
						})),
					};
				});

				initializeChatSession(data.session.id, contentId, transformedMessages);
			} catch (err) {
				setChatError(
					err instanceof Error ? err : new Error("Failed to load session"),
				);
			}
		};

		loadSession();
	}, [contentId]);

	// Send a message
	const sendMessage = useCallback(
		async (content: string, documentContext?: string, planContext?: ActivePlan) => {
			if (!sessionId || !content.trim()) return;

			// Read current state from store (not from stale closure)
			const currentState = getChatState();
			const currentMode = currentState.mode;
			const currentActivePlan = currentState.activePlan;

			// Add user message to state
			addUserMessage(content);

			// Start streaming
			startStreamingWithSteps();

			// Get the full message history including the new message
			const allMessages = [
				...messages.map((m) => ({ role: m.role, content: m.content })),
				{ role: "user" as const, content },
			];

			// Build request with fresh mode from store
			const effectivePlanContext = planContext || (currentMode === "writer" ? currentActivePlan : undefined);

			const request: AgentChatRequest = {
				sessionId,
				contentId,
				messages: allMessages,
				selectionContext: selectionContext || undefined,
				documentContext,
				mode: currentMode,
				model: model === "glm-4.7" ? "z-ai/glm-4.7" : "x-ai/grok-4.1-fast",
				planContext: effectivePlanContext || undefined,
			};

			// Send to API with full context
			await sendAgentMessage(request);
		},
		[sessionId, contentId, messages, selectionContext, model, sendAgentMessage],
	);

	// Clear the conversation
	const clearConversation = useCallback(async () => {
		if (!sessionId) return;

		try {
			const response = await fetch(
				`${clientEnv.VITE_SERVER_URL}/api/agent/chat/session/${sessionId}`,
				{
					method: "DELETE",
					credentials: "include",
				},
			);

			if (!response.ok) {
				throw new Error(`Failed to clear chat: ${response.status}`);
			}

			clearChat();
		} catch (err) {
			setChatError(
				err instanceof Error ? err : new Error("Failed to clear chat"),
			);
		}
	}, [sessionId]);

	return {
		// State
		phase,
		isOpen,
		sessionId,
		messages,
		currentStreamingMessage,
		activeToolCalls,
		streamingSteps,
		selectionContext,
		error,
		isLoading,
		isStreaming: phase === "streaming",

		// Actions
		sendMessage,
		cancelChat,
		clearConversation,
	};
}
