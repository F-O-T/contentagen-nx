import { EventEmitter } from "node:events";
import type { ContentStatus } from "@packages/database/schemas/content";
import type { BrandKnowledgeStatus } from "@packages/database/schemas/agent";
import type { IdeiaStatus } from "@packages/database/schemas/ideas";
// 1. Define event names as constants
export const EVENTS = {
   agentKnowledgeStatus: "agent.knowledge.status",
   contentStatus: "content.status",
   ideaStatus: "idea.status",
} as const;

// 2. Define the payload type for the status change event
export type ContentStatusChangedPayload = {
   contentId: string;
   status: ContentStatus;
};
export type AgentKnowledgeStatusChangedPayload = {
   agentId: string;
   status: BrandKnowledgeStatus;
   message?: string;
};
export type IdeaStatusChangedPayload = {
   ideaId: string;
   status: IdeiaStatus;
   message?: string;
};
// 3. The event emitter instance
export const eventEmitter = new EventEmitter();
export function emitAgentKnowledgeStatusChanged(
   payload: AgentKnowledgeStatusChangedPayload,
) {
   eventEmitter.emit(EVENTS.agentKnowledgeStatus, payload);
}
// 4. Helper to emit a status change event (strongly typed)
export function emitContentStatusChanged(payload: ContentStatusChangedPayload) {
   eventEmitter.emit(EVENTS.contentStatus, payload);
}
export function emitIdeaStatusChanged(payload: IdeaStatusChangedPayload) {
   eventEmitter.emit(EVENTS.ideaStatus, payload);
}
