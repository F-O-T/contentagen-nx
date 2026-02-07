import { z } from "zod";

import { EVENT_CATEGORIES } from "./catalog";
import { type EmitEventParams, emitEvent } from "./emit";

// ---------------------------------------------------------------------------
// Form Event Names
// ---------------------------------------------------------------------------

export const FORM_EVENTS = {
   "form.impression": "form.impression",
   "form.submitted": "form.submitted",
   "form.field_error": "form.field_error",
   "form.conversion": "form.conversion",
} as const;

export type FormEventName = (typeof FORM_EVENTS)[keyof typeof FORM_EVENTS];

// ---------------------------------------------------------------------------
// form.impression
// ---------------------------------------------------------------------------

export const formImpressionEventSchema = z.object({
   contentId: z.uuid().optional(),
   formId: z.string(),
   formName: z.string().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type FormImpressionEvent = z.infer<typeof formImpressionEventSchema>;

export function emitFormImpression(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: FormImpressionEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: FORM_EVENTS["form.impression"],
      eventCategory: EVENT_CATEGORIES.form,
      properties,
   });
}

// ---------------------------------------------------------------------------
// form.submitted
// ---------------------------------------------------------------------------

export const formSubmittedEventSchema = z.object({
   contentId: z.uuid().optional(),
   formId: z.string(),
   formName: z.string().optional(),
   fieldCount: z.number().int().nonnegative().optional(),
   completionTimeSeconds: z.number().nonnegative().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type FormSubmittedEvent = z.infer<typeof formSubmittedEventSchema>;

export function emitFormSubmitted(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: FormSubmittedEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: FORM_EVENTS["form.submitted"],
      eventCategory: EVENT_CATEGORIES.form,
      properties,
   });
}

// ---------------------------------------------------------------------------
// form.field_error
// ---------------------------------------------------------------------------

export const formFieldErrorEventSchema = z.object({
   contentId: z.uuid().optional(),
   formId: z.string(),
   fieldName: z.string(),
   errorType: z.string(),
   errorMessage: z.string().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
});
export type FormFieldErrorEvent = z.infer<typeof formFieldErrorEventSchema>;

export function emitFormFieldError(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: FormFieldErrorEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: FORM_EVENTS["form.field_error"],
      eventCategory: EVENT_CATEGORIES.form,
      properties,
   });
}

// ---------------------------------------------------------------------------
// form.conversion
// ---------------------------------------------------------------------------

export const formConversionEventSchema = z.object({
   contentId: z.uuid().optional(),
   formId: z.string(),
   submissionId: z.uuid(),
});
export type FormConversionEvent = z.infer<typeof formConversionEventSchema>;

export function emitFormConversion(
   ctx: Pick<EmitEventParams, "db" | "posthog" | "organizationId" | "userId">,
   properties: FormConversionEvent,
) {
   return emitEvent({
      ...ctx,
      eventName: FORM_EVENTS["form.conversion"],
      eventCategory: EVENT_CATEGORIES.form,
      properties,
   });
}
