import { z } from "zod";

import { type EmitFn, EVENT_CATEGORIES } from "./catalog";

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
// Dashboard Pricing
// ---------------------------------------------------------------------------

export const DASHBOARD_PRICING: Record<string, string> = {
   "dashboard.created": "0.000000",
   "dashboard.updated": "0.000000",
   "dashboard.deleted": "0.000000",
};

// ---------------------------------------------------------------------------
// dashboard.created
// ---------------------------------------------------------------------------

export const dashboardCreatedEventSchema = z.object({
   dashboardId: z.string().uuid(),
   name: z.string(),
});
export type DashboardCreatedEvent = z.infer<typeof dashboardCreatedEventSchema>;

export function emitDashboardCreated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: DashboardCreatedEvent,
) {
   return emit({
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
export type DashboardUpdatedEvent = z.infer<typeof dashboardUpdatedEventSchema>;

export function emitDashboardUpdated(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: DashboardUpdatedEvent,
) {
   return emit({
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
export type DashboardDeletedEvent = z.infer<typeof dashboardDeletedEventSchema>;

export function emitDashboardDeleted(
   emit: EmitFn,
   ctx: { organizationId: string; userId?: string; teamId?: string },
   properties: DashboardDeletedEvent,
) {
   return emit({
      ...ctx,
      eventName: DASHBOARD_EVENTS["dashboard.deleted"],
      eventCategory: EVENT_CATEGORIES.dashboard,
      properties,
   });
}
