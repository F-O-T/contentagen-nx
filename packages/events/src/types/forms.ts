import { z } from "zod";

// ---------------------------------------------------------------------------
// form.impression
// ---------------------------------------------------------------------------

export const formImpressionEventSchema = z.object({
   organizationId: z.string().uuid(),
   contentId: z.string().uuid().optional(),
   formId: z.string(),
   formName: z.string().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type FormImpressionEvent = z.infer<typeof formImpressionEventSchema>;

// ---------------------------------------------------------------------------
// form.submitted
// ---------------------------------------------------------------------------

export const formSubmittedEventSchema = z.object({
   organizationId: z.string().uuid(),
   contentId: z.string().uuid().optional(),
   formId: z.string(),
   formName: z.string().optional(),
   /** Number of fields in the form */
   fieldCount: z.number().int().nonnegative().optional(),
   /** Time to complete in seconds */
   completionTimeSeconds: z.number().nonnegative().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type FormSubmittedEvent = z.infer<typeof formSubmittedEventSchema>;

// ---------------------------------------------------------------------------
// form.field_error
// ---------------------------------------------------------------------------

export const formFieldErrorEventSchema = z.object({
   organizationId: z.string().uuid(),
   contentId: z.string().uuid().optional(),
   formId: z.string(),
   fieldName: z.string(),
   errorType: z.string(),
   errorMessage: z.string().optional(),
   sessionId: z.string().optional(),
   visitorId: z.string().optional(),
   timestamp: z.string().datetime(),
});
export type FormFieldErrorEvent = z.infer<typeof formFieldErrorEventSchema>;
