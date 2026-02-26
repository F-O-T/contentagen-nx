"use client";

import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { AIChatPlugin } from "@platejs/ai/react";
import { useStore } from "@tanstack/react-store";
import { CheckIcon, Loader2, PauseIcon } from "lucide-react";
import { useEditorPlugin, usePluginOption } from "platejs/react";
import {
	AGENT_DISPLAY_NAMES,
	agentNetworkStore,
	type AgentStatus,
} from "@/features/editor/stores/agent-network-store";

export function AgentNetworkBar() {
	const { api } = useEditorPlugin(AIChatPlugin);
	const chat = usePluginOption(AIChatPlugin, "chat");
	const mode = usePluginOption(AIChatPlugin, "mode");
	const toolName = usePluginOption(AIChatPlugin, "toolName");

	const { status } = chat;
	const isLoading = status === "streaming" || status === "submitted";

	const { isActive, agents } = useStore(agentNetworkStore);

	const shouldShow =
		isLoading &&
		(mode === "insert" ||
			toolName === "comment" ||
			(toolName === "edit" && mode === "chat"));

	if (!shouldShow) return null;

	if (!isActive) {
		return (
			<div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-20 flex items-center gap-3 rounded-md border border-border bg-muted px-3 py-1.5 text-muted-foreground text-sm shadow-md transition-all duration-300">
				<span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
				<span>{status === "submitted" ? "Thinking..." : "Writing..."}</span>
				<Button
					className="flex items-center gap-1 text-xs"
					onClick={() => api.aiChat.stop()}
					size="sm"
					variant="ghost"
				>
					<PauseIcon className="h-4 w-4" />
					Stop
					<kbd className="ml-1 rounded bg-border px-1 font-mono text-[10px] text-muted-foreground shadow-sm">
						Esc
					</kbd>
				</Button>
			</div>
		);
	}

	const activeAgent = agents.find((a) => a.status === "running");
	const routerDone = agents.length > 0;

	return (
		<div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-20 w-72 rounded-lg border border-border bg-popover px-4 py-3 shadow-lg transition-all duration-200">
			{/* Header */}
			<div className="mb-3 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
					<span className="text-xs font-medium text-foreground">
						Agent Network
					</span>
				</div>
				<Button
					className="h-6 gap-1 px-2 text-xs"
					onClick={() => api.aiChat.stop()}
					size="sm"
					variant="ghost"
				>
					<PauseIcon className="h-3 w-3" />
					Stop
				</Button>
			</div>

			{/* Router row */}
			<div className="mb-2 flex items-center gap-2.5 text-xs">
				{routerDone ? (
					<CheckIcon className="h-3.5 w-3.5 shrink-0 text-green-500" />
				) : (
					<Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
				)}
				<span className="text-muted-foreground">Content Router</span>
				{activeAgent && (
					<>
						<span className="text-muted-foreground/50">→</span>
						<span className="font-medium text-foreground">
							{AGENT_DISPLAY_NAMES[activeAgent.id] ?? activeAgent.id}
						</span>
					</>
				)}
			</div>

			{/* Agent rows */}
			{agents.length > 0 && (
				<div className="ml-5 flex flex-col gap-1.5 border-l border-border/40 pl-3">
					{agents.map((agent) => (
						<div key={agent.id} className="flex items-center gap-2 text-xs">
							<AgentStatusIcon status={agent.status} />
							<span
								className={cn(
									agent.status === "running"
										? "text-foreground"
										: "text-muted-foreground",
								)}
							>
								{AGENT_DISPLAY_NAMES[agent.id] ?? agent.id}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}

function AgentStatusIcon({ status }: { status: AgentStatus }) {
	if (status === "running") {
		return <Loader2 className="h-3 w-3 shrink-0 animate-spin text-primary" />;
	}
	return <CheckIcon className="h-3 w-3 shrink-0 text-green-500" />;
}
