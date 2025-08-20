import { EventEmitter } from "node:events";
import type { ContentStatus } from "@packages/database/schemas/content";
// 1. Define event names as constants
export const EVENTS = {
   contentStatus: "content.status",
} as const;

// 2. Define the payload type for the status change event
export type ContentStatusChangedPayload = {
   contentId: string;
   status: ContentStatus;
};

// 3. The event emitter instance
export const eventEmitter = new EventEmitter();

// 4. Helper to emit a status change event (strongly typed)
export function emitContentStatusChanged(payload: ContentStatusChangedPayload) {
   eventEmitter.emit(EVENTS.contentStatus, payload);
}
