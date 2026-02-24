import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

// ---------------------------------------------------------------------------
// Writer Event Names
// ---------------------------------------------------------------------------

export const WRITER_EVENTS = {
   "writer.created": "writer.created",
   "writer.updated": "writer.updated",
   "writer.deleted": "writer.deleted",
} as const;

export type WriterEventName =
   (typeof WRITER_EVENTS)[keyof typeof WRITER_EVENTS];

// ---------------------------------------------------------------------------
// Writer Pricing
// ---------------------------------------------------------------------------

export const WRITER_PRICING: Record<string, string> = {
   "writer.created": "0.000000",
   "writer.updated": "0.000000",
   "writer.deleted": "0.000000",
};

// ---------------------------------------------------------------------------
// writer.created
// ---------------------------------------------------------------------------

export const writerCreatedEventSchema = z.object({
   writerId: z.string().uuid(),
   name: z.string(),
});
export type WriterCreatedEvent = z.infer<typeof writerCreatedEventSchema>;

export function emitWriterCreated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WriterCreatedEvent,
) {
   return emit({
      ...ctx,
      eventName: WRITER_EVENTS["writer.created"],
      eventCategory: EVENT_CATEGORIES.writer,
      properties,
   });
}

// ---------------------------------------------------------------------------
// writer.updated
// ---------------------------------------------------------------------------

export const writerUpdatedEventSchema = z.object({
   writerId: z.string().uuid(),
   changedFields: z.array(z.string()),
});
export type WriterUpdatedEvent = z.infer<typeof writerUpdatedEventSchema>;

export function emitWriterUpdated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WriterUpdatedEvent,
) {
   return emit({
      ...ctx,
      eventName: WRITER_EVENTS["writer.updated"],
      eventCategory: EVENT_CATEGORIES.writer,
      properties,
   });
}

// ---------------------------------------------------------------------------
// writer.deleted
// ---------------------------------------------------------------------------

export const writerDeletedEventSchema = z.object({
   writerId: z.string().uuid(),
});
export type WriterDeletedEvent = z.infer<typeof writerDeletedEventSchema>;

export function emitWriterDeleted(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: WriterDeletedEvent,
) {
   return emit({
      ...ctx,
      eventName: WRITER_EVENTS["writer.deleted"],
      eventCategory: EVENT_CATEGORIES.writer,
      properties,
   });
}
