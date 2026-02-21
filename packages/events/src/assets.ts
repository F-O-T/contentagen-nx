import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Asset Event Names
// ---------------------------------------------------------------------------

export const ASSET_EVENTS = {
   "asset.upload_completed": "asset.upload_completed",
   "asset.deleted": "asset.deleted",
   "asset.thumbnail_generated": "asset.thumbnail_generated",
} as const;

export type AssetEventName = (typeof ASSET_EVENTS)[keyof typeof ASSET_EVENTS];

// ---------------------------------------------------------------------------
// asset.upload_completed
// ---------------------------------------------------------------------------

export const assetUploadCompletedEventSchema = z.object({
   assetId: z.string(),
   filename: z.string(),
   mimeType: z.string(),
   size: z.number().int().nonnegative(),
   uploaderId: z.string(),
});
export type AssetUploadCompletedEvent = z.infer<
   typeof assetUploadCompletedEventSchema
>;

export function emitAssetUploadCompleted(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: AssetUploadCompletedEvent,
): void {
   emitEvent({
      ...ctx,
      eventName: ASSET_EVENTS["asset.upload_completed"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// asset.deleted
// ---------------------------------------------------------------------------

export const assetDeletedEventSchema = z.object({
   assetId: z.string(),
});
export type AssetDeletedEvent = z.infer<typeof assetDeletedEventSchema>;

export function emitAssetDeleted(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: AssetDeletedEvent,
): void {
   emitEvent({
      ...ctx,
      eventName: ASSET_EVENTS["asset.deleted"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// asset.thumbnail_generated
// ---------------------------------------------------------------------------

export const assetThumbnailGeneratedEventSchema = z.object({
   assetId: z.string(),
});
export type AssetThumbnailGeneratedEvent = z.infer<
   typeof assetThumbnailGeneratedEventSchema
>;

export function emitAssetThumbnailGenerated(
   ctx: Pick<
      EmitEventParams,
      "db" | "posthog" | "organizationId" | "userId" | "teamId"
   >,
   properties: AssetThumbnailGeneratedEvent,
): void {
   emitEvent({
      ...ctx,
      eventName: ASSET_EVENTS["asset.thumbnail_generated"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}
