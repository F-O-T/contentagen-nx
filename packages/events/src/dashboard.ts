import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Dashboard Event Names
// ---------------------------------------------------------------------------

export const DASHBOARD_EVENTS = {
   "dashboard.created": "dashboard.created",
   "dashboard.updated": "dashboard.updated",
   "dashboard.deleted": "dashboard.deleted",
} as const;

export type DashboardEventName =
   (typeof DASHBOARD_EVENTS)[keyof typeof DASHBOARD_EVENTS];

// ---------------------------------------------------------------------------
// dashboard.created
// ---------------------------------------------------------------------------

export const dashboardCreatedEventSchema = z.object({
   dashboardId: z.string().uuid(),
   name: z.string(),
});
export type DashboardCreatedEvent = z.infer<
   typeof dashboardCreatedEventSchema
>;

export function emitDashboardCreated(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: DashboardCreatedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: DASHBOARD_EVENTS["dashboard.created"],
      eventCategory: EVENT_CATEGORIES.dashboard,
      properties,
   });
}

// ---------------------------------------------------------------------------
// dashboard.updated
// ---------------------------------------------------------------------------

export const dashboardUpdatedEventSchema = z.object({
   dashboardId: z.string().uuid(),
   changedFields: z.array(z.string()),
});
export type DashboardUpdatedEvent = z.infer<
   typeof dashboardUpdatedEventSchema
>;

export function emitDashboardUpdated(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: DashboardUpdatedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: DASHBOARD_EVENTS["dashboard.updated"],
      eventCategory: EVENT_CATEGORIES.dashboard,
      properties,
   });
}

// ---------------------------------------------------------------------------
// dashboard.deleted
// ---------------------------------------------------------------------------

export const dashboardDeletedEventSchema = z.object({
   dashboardId: z.string().uuid(),
});
export type DashboardDeletedEvent = z.infer<
   typeof dashboardDeletedEventSchema
>;

export function emitDashboardDeleted(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId" | "teamId">,
   properties: DashboardDeletedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: DASHBOARD_EVENTS["dashboard.deleted"],
      eventCategory: EVENT_CATEGORIES.dashboard,
      properties,
   });
}
