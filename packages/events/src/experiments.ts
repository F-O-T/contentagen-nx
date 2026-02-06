import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Experiment Event Names
// ---------------------------------------------------------------------------

export const EXPERIMENT_EVENTS = {
   "experiment.started": "experiment.started",
   "experiment.conversion": "experiment.conversion",
} as const;

export type ExperimentEventName =
   (typeof EXPERIMENT_EVENTS)[keyof typeof EXPERIMENT_EVENTS];

// ---------------------------------------------------------------------------
// experiment.started
// ---------------------------------------------------------------------------

export const experimentStartedEventSchema = z.object({
   contentId: z.uuid(),
   experimentId: z.uuid(),
   variantId: z.string(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type ExperimentStartedEvent = z.infer<
   typeof experimentStartedEventSchema
>;

export function emitExperimentStarted(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: ExperimentStartedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: EXPERIMENT_EVENTS["experiment.started"],
      eventCategory: EVENT_CATEGORIES.experiment,
      properties,
   });
}

// ---------------------------------------------------------------------------
// experiment.conversion
// ---------------------------------------------------------------------------

export const experimentConversionEventSchema = z.object({
   contentId: z.uuid(),
   experimentId: z.uuid(),
   variantId: z.string(),
   goalName: z.string(),
   goalValue: z.number().nonnegative().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type ExperimentConversionEvent = z.infer<
   typeof experimentConversionEventSchema
>;

export function emitExperimentConversion(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: ExperimentConversionEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: EXPERIMENT_EVENTS["experiment.conversion"],
      eventCategory: EVENT_CATEGORIES.experiment,
      properties,
   });
}
