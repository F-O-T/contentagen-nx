import { ScrollArea } from "@packages/ui/components/scroll-area";
import { cn } from "@packages/ui/lib/utils";
import { useEffect, useRef } from "react";
import { useChatSession } from "../hooks/use-chat-session";
import {
	useChatState,
	setContentMetadata,
	type ContentMetadata,
	type PlanStep,
	type ActivePlan,
} from "../context/chat-context";
import { ChatInput } from "./chat-input";
import { ChatMessageList } from "./chat-message-list";
import { ChatSelectionContext } from "./chat-selection-context";

interface ChatSidebarProps {
	contentId: string;
	contentMeta?: ContentMetadata;
	className?: string;
	fullPage?: boolean;
	onAgentComplete?: () => void;
}

export function ChatSidebar({
	contentId,
	contentMeta,
	className,
	fullPage = false,
	onAgentComplete,
}: ChatSidebarProps) {
	const { selectionContext, documentContent, activeToolCalls, mode } =
		useChatState();
	
	// Track last metadata to prevent unnecessary updates
	const lastMetaRef = useRef<string | null>(null);

	const {
		messages,
		currentStreamingMessage,
		streamingSteps,
		isStreaming,
		sendMessage,
		cancelChat,
	} = useChatSession(contentId, { onAgentComplete });

	// Update content metadata when prop changes (using stable comparison)
	useEffect(() => {
		if (contentMeta) {
			const metaKey = JSON.stringify(contentMeta);
			if (metaKey !== lastMetaRef.current) {
				lastMetaRef.current = metaKey;
				setContentMetadata(contentMeta);
			}
		}
	}, [contentMeta]);

	const handleSend = (content: string) => {
		// Pass document content with the message
		sendMessage(content, documentContent);
	};

	const handleExecutePlan = (_approvedSteps: PlanStep[], executionPrompt: string, planContext: ActivePlan) => {
		// Send the execution prompt to the agent in writer mode with plan context
		sendMessage(executionPrompt, documentContent, planContext);
	};

	return (
		<div
			className={cn(
				"flex h-full flex-col bg-background overflow-hidden",
				fullPage 
					? "w-full max-w-3xl mx-auto" 
					: "w-4/12 shrink-0 border-l",
				className,
			)}
		>
			{/* Header for full-page mode */}
			{fullPage && (
				<div className="flex items-center justify-center py-6 border-b">
					<div className="text-center">
						<h1 className="text-xl font-semibold">Plan Your Content</h1>
						<p className="text-sm text-muted-foreground mt-1">
							Describe what you want to write and the AI will help you plan it
						</p>
					</div>
				</div>
			)}

			{/* Messages */}
			<ScrollArea className="flex-1 min-h-0">
				<ChatMessageList
					messages={messages}
					streamingContent={currentStreamingMessage}
					isStreaming={isStreaming}
					activeToolCalls={activeToolCalls}
					streamingSteps={streamingSteps}
					onExecutePlan={handleExecutePlan}
				/>
			</ScrollArea>

			{/* Selection Context */}
			{selectionContext && (
				<ChatSelectionContext context={selectionContext} />
			)}

			{/* Input Area */}
			<div className={cn(
				"shrink-0 border-t",
				fullPage ? "p-6" : "p-3"
			)}>
				<ChatInput
					onSend={handleSend}
					onCancel={cancelChat}
					isLoading={isStreaming}
					placeholder={
						mode === "plan"
							? "What would you like to plan?"
							: "What should I write or edit?"
					}
				/>
			</div>
		</div>
	);
}
