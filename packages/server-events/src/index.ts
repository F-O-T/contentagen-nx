import { EventEmitter } from "node:events";

// 1. Define event names as constants
export const CONTENT_EVENTS = {
   statusChanged: "content.statusChanged",
} as const;

// 2. Define the payload type for the status change event
export type ContentStatusChangedPayload = {
   contentId: string;
   status: "generating" | "draft" | "approved";
};

// 3. The event emitter instance
export const contentEvent = new EventEmitter();

// 4. Helper to emit a status change event (strongly typed)
export function emitContentStatusChanged(payload: ContentStatusChangedPayload) {
   contentEvent.emit(CONTENT_EVENTS.statusChanged, payload);
}
