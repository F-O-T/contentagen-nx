import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

// ---------------------------------------------------------------------------
// Cluster Event Names
// ---------------------------------------------------------------------------

export const CLUSTER_EVENTS = {
   "cluster.created": "cluster.created",
   "cluster.satellite.added": "cluster.satellite.added",
   "cluster.satellite.removed": "cluster.satellite.removed",
} as const;

export type ClusterEventName =
   (typeof CLUSTER_EVENTS)[keyof typeof CLUSTER_EVENTS];

// ---------------------------------------------------------------------------
// cluster.created
// ---------------------------------------------------------------------------

export const clusterCreatedEventSchema = z.object({
   clusterId: z.string().uuid(),
   pillarTitle: z.string(),
   satelliteCount: z.number().int().min(0),
   mode: z.string().optional(),
});
export type ClusterCreatedEvent = z.infer<typeof clusterCreatedEventSchema>;

export function emitClusterCreated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ClusterCreatedEvent,
) {
   return emit({
      ...ctx,
      eventName: CLUSTER_EVENTS["cluster.created"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// cluster.satellite.added
// ---------------------------------------------------------------------------

export const clusterSatelliteAddedEventSchema = z.object({
   clusterId: z.string().uuid(),
   satelliteId: z.string().uuid(),
   relationType: z.enum(["manual", "ai_suggested"]),
});
export type ClusterSatelliteAddedEvent = z.infer<
   typeof clusterSatelliteAddedEventSchema
>;

export function emitClusterSatelliteAdded(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ClusterSatelliteAddedEvent,
) {
   return emit({
      ...ctx,
      eventName: CLUSTER_EVENTS["cluster.satellite.added"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}

// ---------------------------------------------------------------------------
// cluster.satellite.removed
// ---------------------------------------------------------------------------

export const clusterSatelliteRemovedEventSchema = z.object({
   clusterId: z.string().uuid(),
   satelliteId: z.string().uuid(),
});
export type ClusterSatelliteRemovedEvent = z.infer<
   typeof clusterSatelliteRemovedEventSchema
>;

export function emitClusterSatelliteRemoved(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: ClusterSatelliteRemovedEvent,
) {
   return emit({
      ...ctx,
      eventName: CLUSTER_EVENTS["cluster.satellite.removed"],
      eventCategory: EVENT_CATEGORIES.content,
      properties,
   });
}
