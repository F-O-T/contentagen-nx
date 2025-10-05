import { EventEmitter } from "node:events";
import type { ContentStatus } from "@packages/database/schemas/content";
import type { IdeiaStatus } from "@packages/database/schemas/ideas";
import type { KnowledgeCreationStatus } from "@packages/database/schemas/competitor";
import type { ContentRequest } from "@packages/database/schemas/content";
// 1. Define event names as constants
export const EVENTS = {
   agentKnowledgeStatus: "agent.knowledge.status",
   contentStatus: "content.status",
   competitorStatus: "competitor.status",
   ideaStatus: "idea.status",
} as const;

// 2. Define the payload type for the status change event
export type ContentStatusChangedPayload = {
   contentId: string;
   status: ContentStatus;
   message?: string;
   layout?: ContentRequest["layout"];
};
export type CompetitorStatusChangedPayload = {
   competitorId: string;
   status: KnowledgeCreationStatus;
   message?: string;
};
export type IdeaStatusChangedPayload = {
   ideaId: string;
   status: IdeiaStatus;
   message?: string;
};
// 3. The event emitter instance
export const eventEmitter = new EventEmitter();
// 4. Helper to emit a status change event (strongly typed)
export function emitContentStatusChanged(payload: ContentStatusChangedPayload) {
   eventEmitter.emit(EVENTS.contentStatus, payload);
}
export function emitCompetitorStatusChanged(
   payload: CompetitorStatusChangedPayload,
) {
   eventEmitter.emit(EVENTS.competitorStatus, payload);
}
export function emitIdeaStatusChanged(payload: IdeaStatusChangedPayload) {
   eventEmitter.emit(EVENTS.ideaStatus, payload);
}
