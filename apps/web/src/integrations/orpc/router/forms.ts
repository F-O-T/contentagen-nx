import { ORPCError } from "@orpc/server";
import {
	countFormSubmissions,
	createForm,
	deleteForm,
	getFormById,
	getFormSubmissions,
	listForms,
	updateForm,
} from "@packages/database/repositories/form-repository";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const fieldSchema = z.object({
	id: z.string(),
	type: z.enum(["text", "email", "textarea", "checkbox", "select"]),
	label: z.string(),
	placeholder: z.string().optional(),
	required: z.boolean(),
	options: z.array(z.string()).optional(),
});

const settingsSchema = z.object({
	successMessage: z.string().optional(),
	redirectUrl: z.string().optional(),
	sendEmailNotification: z.boolean().optional(),
	emailRecipients: z.array(z.string()).optional(),
});

const createFormSchema = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	fields: z.array(fieldSchema).min(1),
	settings: settingsSchema.optional(),
});

const updateFormSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1).optional(),
	description: z.string().optional(),
	fields: z.array(fieldSchema).min(1).optional(),
	settings: settingsSchema.optional(),
	isActive: z.boolean().optional(),
});

// =============================================================================
// Form Procedures
// =============================================================================

/**
 * Create a new form
 */
export const create = protectedProcedure
	.input(createFormSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const form = await createForm(db, {
			organizationId,
			name: input.name,
			description: input.description,
			fields: input.fields,
			settings: input.settings ?? {},
		});

		return form;
	});

/**
 * List all forms for the organization, including submission counts
 */
export const list = protectedProcedure.handler(async ({ context }) => {
	const { organizationId, db } = context;

	return await listForms(db, organizationId);
});

/**
 * Get form by ID (verifies organization ownership)
 */
export const getById = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const form = await getFormById(db, input.id);

		if (!form || form.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Form not found.",
			});
		}

		return form;
	});

/**
 * Update a form
 */
export const update = protectedProcedure
	.input(updateFormSchema)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const form = await getFormById(db, input.id);

		if (!form || form.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Form not found.",
			});
		}

		const { id: _id, ...updateData } = input;
		const updated = await updateForm(db, input.id, updateData);
		return updated;
	});

/**
 * Delete a form
 */
export const remove = protectedProcedure
	.input(z.object({ id: z.string().uuid() }))
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const form = await getFormById(db, input.id);

		if (!form || form.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Form not found.",
			});
		}

		await deleteForm(db, input.id);
		return { success: true };
	});

/**
 * Get paginated submissions for a form (verifies form ownership)
 */
export const getSubmissions = protectedProcedure
	.input(
		z.object({
			formId: z.string().uuid(),
			page: z.number().min(1).optional().default(1),
			limit: z.number().min(1).max(100).optional().default(50),
		}),
	)
	.handler(async ({ context, input }) => {
		const { organizationId, db } = context;

		const form = await getFormById(db, input.formId);

		if (!form || form.organizationId !== organizationId) {
			throw new ORPCError("NOT_FOUND", {
				message: "Form not found.",
			});
		}

		const offset = (input.page - 1) * input.limit;

		const [submissions, total] = await Promise.all([
			getFormSubmissions(db, input.formId, {
				offset,
				limit: input.limit,
			}),
			countFormSubmissions(db, input.formId),
		]);

		return {
			submissions,
			total,
			page: input.page,
			limit: input.limit,
			pages: Math.ceil(total / input.limit),
		};
	});
