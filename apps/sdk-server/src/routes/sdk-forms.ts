import { forms, formSubmissions } from "@packages/database/schemas/forms";
import { EVENT_CATEGORIES } from "@packages/events/catalog";
import { emitEvent } from "@packages/events/emit";
import { FORM_EVENTS } from "@packages/events/forms";
import { and, eq } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { db } from "../integrations/database";
import { posthog } from "../integrations/posthog";
import { authenticateRequest } from "../utils/sdk-auth";

// ── Basic email regex ────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// UUID v4 format pattern for Elysia param validation
const UUID_PATTERN =
	"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$";

/**
 * Validates submitted data against the form field definitions.
 * Returns a map of fieldId -> error message for any validation failures.
 */
function validateSubmission(
	fields: Array<{
		id: string;
		type: "text" | "email" | "textarea" | "checkbox" | "select";
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
			if (
				typeof value !== "string" ||
				!field.options.includes(value)
			) {
				errors[field.id] = `${field.label} must be one of the allowed options.`;
			}
		}
	}

	return Object.keys(errors).length > 0 ? errors : null;
}

// ── Elysia Plugin ────────────────────────────────────────────────

export const sdkFormRoutes = new Elysia({
	prefix: "/sdk/forms",
})
	// GET /sdk/forms/:formId — Fetch a form definition
	.get(
		"/:formId",
		async ({ params, request, set }) => {
			const authResult = await authenticateRequest(request, set);
			if (!authResult.success) {
				return { error: authResult.error };
			}

			const { organizationId } = authResult;

			const [form] = await db
				.select({
					id: forms.id,
					name: forms.name,
					description: forms.description,
					fields: forms.fields,
					settings: forms.settings,
				})
				.from(forms)
				.where(
					and(
						eq(forms.id, params.formId),
						eq(forms.organizationId, organizationId),
						eq(forms.isActive, true),
					),
				)
				.limit(1);

			if (!form) {
				set.status = 404;
				return { error: "Form not found." };
			}

			return form;
		},
		{
			params: t.Object({
				formId: t.String({ pattern: UUID_PATTERN }),
			}),
		},
	)

	// POST /sdk/forms/:formId/submit — Submit form data
	.post(
		"/:formId/submit",
		async ({ params, body, request, set }) => {
			const authResult = await authenticateRequest(request, set);
			if (!authResult.success) {
				return { error: authResult.error };
			}

			const { organizationId, userId } = authResult;

			// Fetch form definition
			const [form] = await db
				.select()
				.from(forms)
				.where(
					and(
						eq(forms.id, params.formId),
						eq(forms.organizationId, organizationId),
						eq(forms.isActive, true),
					),
				)
				.limit(1);

			if (!form) {
				set.status = 404;
				return { error: "Form not found." };
			}

			// Validate submission data against field definitions
			const validationErrors = validateSubmission(form.fields, body.data);
			if (validationErrors) {
				set.status = 422;
				return {
					error: "Validation failed",
					errors: validationErrors,
				};
			}

			// Build submission metadata from request + body
			const ipAddress =
				request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
				request.headers.get("x-real-ip") ??
				undefined;
			const userAgent = request.headers.get("user-agent") ?? undefined;

			const submissionMetadata = {
				ipAddress,
				userAgent,
				referrer: body.metadata?.referrer,
				visitorId: body.metadata?.visitorId,
				sessionId: body.metadata?.sessionId,
			};

			// Store submission
			let submission: { id: string };
			try {
				const [result] = await db
					.insert(formSubmissions)
					.values({
						formId: form.id,
						organizationId,
						data: body.data,
						metadata: submissionMetadata,
					})
					.returning({ id: formSubmissions.id });

				if (!result) {
					set.status = 500;
					return { error: "Failed to store submission." };
				}
				submission = result;
			} catch (error) {
				console.error("[SDK Forms] Failed to store submission:", error);
				set.status = 500;
				return { error: "Failed to store submission." };
			}

			// Emit form.submitted event (non-blocking, failure-tolerant)
			emitEvent({
				db,
				posthog,
				organizationId,
				eventName: FORM_EVENTS["form.submitted"],
				eventCategory: EVENT_CATEGORIES.form,
				properties: {
					formId: form.id,
					visitorId: body.metadata?.visitorId,
					sessionId: body.metadata?.sessionId,
					fieldCount: form.fields.length,
				},
				userId: userId ?? undefined,
			});

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
		},
		{
			params: t.Object({
				formId: t.String({ pattern: UUID_PATTERN }),
			}),
			body: t.Object({
				data: t.Record(t.String(), t.Unknown()),
				metadata: t.Optional(
					t.Object({
						visitorId: t.Optional(t.String()),
						sessionId: t.Optional(t.String()),
						referrer: t.Optional(t.String()),
						url: t.Optional(t.String()),
					}),
				),
			}),
		},
	);
