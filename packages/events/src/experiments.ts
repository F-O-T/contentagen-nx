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

export const EXPERIMENT_TARGET_TYPES = ["content", "form", "cluster"] as const;
export type ExperimentTargetType = (typeof EXPERIMENT_TARGET_TYPES)[number];

// ---------------------------------------------------------------------------
// experiment.started
// ---------------------------------------------------------------------------

export const experimentStartedEventSchema = z
   .object({
      // Target-agnostic fields (preferred)
      targetType: z.enum(EXPERIMENT_TARGET_TYPES).optional(),
      targetId: z.uuid().optional(),
      // Legacy field — maps to targetType="content", kept for backwards compat
      contentId: z.uuid().optional(),
      experimentId: z.uuid(),
      variantId: z.string(),
      sessionId: z.string().optional(),
      visitorId: z.string().optional(),
   })
   .refine(
      (d) =>
         d.contentId != null || (d.targetType != null && d.targetId != null),
      {
         message:
            "Either contentId or both targetType and targetId must be provided",
      },
   );
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

export const experimentConversionEventSchema = z
   .object({
      // Target-agnostic fields (preferred)
      targetType: z.enum(EXPERIMENT_TARGET_TYPES).optional(),
      targetId: z.uuid().optional(),
      // Legacy field — maps to targetType="content", kept for backwards compat
      contentId: z.uuid().optional(),
      experimentId: z.uuid(),
      variantId: z.string(),
      goalName: z.string(),
      goalValue: z.number().nonnegative().optional(),
      sessionId: z.string().optional(),
      visitorId: z.string().optional(),
   })
   .refine(
      (d) =>
         d.contentId != null || (d.targetType != null && d.targetId != null),
      {
         message:
            "Either contentId or both targetType and targetId must be provided",
      },
   );
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
