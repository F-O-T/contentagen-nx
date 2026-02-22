import { ORPCError } from "@orpc/server";
import { formSubmissions, forms } from "@packages/database/schemas/forms";
import { EVENT_CATEGORIES } from "@packages/events/catalog";
import { createEmitFn, emitEvent } from "@packages/events/emit";
import { emitExperimentConversion } from "@packages/events/experiments";
import { FORM_EVENTS } from "@packages/events/forms";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { sdkProcedure } from "../server";

// ── Basic email regex ────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates submitted data against the form field definitions.
 * Returns a map of fieldId -> error message for any validation failures.
 */
function validateSubmission(
   fields: Array<{
      id: string;
      type:
         | "text"
         | "email"
         | "textarea"
         | "checkbox"
         | "select"
         | "number"
         | "date"
         | "rating"
         | "file";
      label: string;
      required: boolean;
      options?: string[];
   }>,
   data: Record<string, unknown>,
): Record<string, string> | null {
   const errors: Record<string, string> = {};

   for (const field of fields) {
      const value = data[field.id];

      // Required check
      if (field.required) {
         if (field.type === "checkbox") {
            if (value !== true && value !== "on" && value !== "true") {
               errors[field.id] = `${field.label} is required.`;
               continue;
            }
         } else if (
            value === undefined ||
            value === null ||
            (typeof value === "string" && value.trim() === "")
         ) {
            errors[field.id] = `${field.label} is required.`;
            continue;
         }
      }

      // Email format check
      if (
         field.type === "email" &&
         value !== undefined &&
         value !== null &&
         value !== ""
      ) {
         if (typeof value !== "string" || !EMAIL_REGEX.test(value)) {
            errors[field.id] = `${field.label} must be a valid email address.`;
         }
      }

      // Select must be one of the allowed options
      if (
         field.type === "select" &&
         field.options &&
         value !== undefined &&
         value !== null &&
         value !== ""
      ) {
         if (typeof value !== "string" || !field.options.includes(value)) {
            errors[field.id] =
               `${field.label} must be one of the allowed options.`;
         }
      }

      // Number validation
      if (
         field.type === "number" &&
         value !== undefined &&
         value !== null &&
         value !== ""
      ) {
         if (typeof value !== "string" || Number.isNaN(Number(value))) {
            errors[field.id] = `${field.label} must be a valid number.`;
         }
      }

      // Rating validation (1-5)
      if (
         field.type === "rating" &&
         value !== undefined &&
         value !== null &&
         value !== ""
      ) {
         const num = Number(value);
         if (Number.isNaN(num) || num < 1 || num > 5) {
            errors[field.id] = `${field.label} must be between 1 and 5.`;
         }
      }
   }

   return Object.keys(errors).length > 0 ? errors : null;
}

// =============================================================================
// Forms Procedures
// =============================================================================

/**
 * Get form definition by ID
 */
export const get = sdkProcedure
   .input(
      z.object({
         formId: z.string().uuid(),
      }),
   )
   .handler(async ({ context, input }) => {
      const [form] = await context.db
         .select({
            id: forms.id,
            name: forms.name,
            description: forms.description,
            fields: forms.fields,
            settings: forms.settings,
            title: forms.title,
            subtitle: forms.subtitle,
            icon: forms.icon,
            buttonText: forms.buttonText,
            layout: forms.layout,
         })
         .from(forms)
         .where(
            and(
               eq(forms.id, input.formId),
               eq(forms.organizationId, context.organizationId),
               eq(forms.isActive, true),
            ),
         )
         .limit(1);

      if (!form) {
         throw new ORPCError("NOT_FOUND", { message: "Form not found." });
      }

      return form;
   });

/**
 * Submit form data
 */
export const submit = sdkProcedure
   .input(
      z.object({
         formId: z.string().uuid(),
         data: z.record(z.string(), z.unknown()),
         metadata: z
            .object({
               visitorId: z.string().optional(),
               sessionId: z.string().optional(),
               referrer: z.string().optional(),
               url: z.string().optional(),
            })
            .optional(),
         experimentId: z.string().uuid().optional(),
         variantId: z.string().optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      // Fetch form definition
      const [form] = await context.db
         .select()
         .from(forms)
         .where(
            and(
               eq(forms.id, input.formId),
               eq(forms.organizationId, context.organizationId),
               eq(forms.isActive, true),
            ),
         )
         .limit(1);

      if (!form) {
         throw new ORPCError("NOT_FOUND", { message: "Form not found." });
      }

      // Validate submission data against field definitions
      const validationErrors = validateSubmission(form.fields, input.data);
      if (validationErrors) {
         throw new ORPCError("UNPROCESSABLE_ENTITY", {
            message: "Validation failed",
            cause: { errors: validationErrors },
         });
      }

      // Build submission metadata from request + input
      const ipAddress =
         context.request.headers
            .get("x-forwarded-for")
            ?.split(",")[0]
            ?.trim() ??
         context.request.headers.get("x-real-ip") ??
         undefined;
      const userAgent = context.request.headers.get("user-agent") ?? undefined;

      const submissionMetadata = {
         ipAddress,
         userAgent,
         referrer: input.metadata?.referrer,
         visitorId: input.metadata?.visitorId,
         sessionId: input.metadata?.sessionId,
      };

      // Store submission
      let submission: { id: string };
      try {
         const [result] = await context.db
            .insert(formSubmissions)
            .values({
               formId: form.id,
               organizationId: context.organizationId,
               teamId: form.teamId,
               data: input.data,
               metadata: submissionMetadata,
            })
            .returning({ id: formSubmissions.id });

         if (!result) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
               message: "Failed to store submission.",
            });
         }
         submission = result;
      } catch (error) {
         console.error("[SDK Forms] Failed to store submission:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to store submission.",
         });
      }

      // Emit form.submitted event (non-blocking, failure-tolerant)
      emitEvent({
         db: context.db,
         posthog: context.posthog,
         organizationId: context.organizationId,
         eventName: FORM_EVENTS["form.submitted"],
         eventCategory: EVENT_CATEGORIES.form,
         properties: {
            formId: form.id,
            visitorId: input.metadata?.visitorId,
            sessionId: input.metadata?.sessionId,
            fieldCount: form.fields.length,
         },
         userId: context.userId ?? undefined,
      });

      // Emit experiment.conversion if this form is part of an A/B test
      if (input.experimentId && input.variantId) {
         const emit = createEmitFn(context.db, context.posthog);
         emitExperimentConversion(
            emit,
            {
               organizationId: context.organizationId,
               userId: context.userId ?? undefined,
            },
            {
               targetType: "form",
               targetId: form.id,
               experimentId: input.experimentId,
               variantId: input.variantId,
               goalName: "form.submit",
            },
         );
      }

      return {
         success: true as const,
         submissionId: submission.id,
         settings: {
            successMessage:
               form.settings?.successMessage ??
               "Thank you! Your submission has been received.",
            redirectUrl: form.settings?.redirectUrl,
         },
      };
   });
