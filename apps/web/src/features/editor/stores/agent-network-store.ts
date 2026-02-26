import { Store } from "@tanstack/react-store";

export const NETWORK_AGENT_IDS = new Set([
	"research-agent",
	"writer-agent",
	"seo-auditor-agent",
	"reviewer-agent",
]);

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
	"research-agent": "Research & Planning",
	"writer-agent": "Writer & Editor",
	"seo-auditor-agent": "SEO Auditor",
	"reviewer-agent": "Content Reviewer",
};

export type AgentStatus = "running" | "complete";

export interface AgentEntry {
	id: string;
	status: AgentStatus;
}

interface AgentNetworkState {
	isActive: boolean;
	agents: AgentEntry[];
}

export const agentNetworkStore = new Store<AgentNetworkState>({
	isActive: false,
	agents: [],
});

export function resetAgentNetwork() {
	agentNetworkStore.setState(() => ({ isActive: false, agents: [] }));
}

export function startNetworkAgent(agentId: string) {
	agentNetworkStore.setState((prev) => ({
		isActive: true,
		agents: [
			...prev.agents.filter((a) => a.id !== agentId),
			{ id: agentId, status: "running" },
		],
	}));
}

export function completeNetworkAgent(agentId: string) {
	agentNetworkStore.setState((prev) => ({
		...prev,
		agents: prev.agents.map((a) =>
			a.id === agentId ? { ...a, status: "complete" as AgentStatus } : a,
		),
	}));
}
