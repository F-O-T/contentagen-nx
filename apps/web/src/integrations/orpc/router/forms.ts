import { ORPCError } from "@orpc/server";
import {
   countFormSubmissions,
   createForm,
   deleteForm,
   getFormById,
   getFormSubmissions,
   listFormsByTeam,
   updateForm,
} from "@packages/database/repositories/form-repository";
import { createEmitFn } from "@packages/events/emit";
import {
   emitFormCreated,
   emitFormDeleted,
   emitFormUpdated,
} from "@packages/events/forms";
import { z } from "zod";
import { protectedProcedure } from "../server";

// =============================================================================
// Validation Schemas
// =============================================================================

const fieldSchema = z.object({
   id: z.string(),
   type: z.enum([
      "text",
      "email",
      "textarea",
      "checkbox",
      "select",
      "number",
      "date",
      "rating",
      "file",
   ]),
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
   title: z.string().optional(),
   subtitle: z.string().optional(),
   icon: z.string().optional(),
   buttonText: z.string().optional(),
   layout: z.enum(["card", "inline", "banner"]).optional(),
});

const updateFormSchema = z.object({
   id: z.string().uuid(),
   name: z.string().min(1).optional(),
   description: z.string().optional(),
   fields: z.array(fieldSchema).min(1).optional(),
   settings: settingsSchema.optional(),
   isActive: z.boolean().optional(),
   title: z.string().optional(),
   subtitle: z.string().optional(),
   icon: z.string().optional(),
   buttonText: z.string().optional(),
   layout: z.enum(["card", "inline", "banner"]).optional(),
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
      const { organizationId, teamId, db, posthog, userId } = context;

      const form = await createForm(db, {
         organizationId,
         teamId,
         name: input.name,
         description: input.description,
         fields: input.fields,
         settings: input.settings ?? {},
         title: input.title,
         subtitle: input.subtitle,
         icon: input.icon,
         buttonText: input.buttonText,
         layout: input.layout,
      });

      try {
         await emitFormCreated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { formId: form.id, name: input.name },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return form;
   });

/**
 * List all forms for the active team, including submission counts
 */
export const list = protectedProcedure.handler(async ({ context }) => {
   const { teamId, db } = context;

   return await listFormsByTeam(db, teamId);
});

/**
 * Get form by ID (verifies organization ownership and team access)
 */
export const getById = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db } = context;

      const form = await getFormById(db, input.id);

      if (
         !form ||
         form.organizationId !== organizationId ||
         form.teamId !== teamId
      ) {
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
      const { organizationId, teamId, db, posthog, userId } = context;

      const form = await getFormById(db, input.id);

      if (
         !form ||
         form.organizationId !== organizationId ||
         form.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Form not found.",
         });
      }

      const { id: _id, ...updateData } = input;
      const updated = await updateForm(db, input.id, updateData);

      try {
         const changedFields = Object.keys(updateData).filter(
            (k) => updateData[k as keyof typeof updateData] !== undefined,
         );
         await emitFormUpdated(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { formId: input.id, changedFields },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return updated;
   });

/**
 * Delete a form
 */
export const remove = protectedProcedure
   .input(z.object({ id: z.string().uuid() }))
   .handler(async ({ context, input }) => {
      const { organizationId, teamId, db, posthog, userId } = context;

      const form = await getFormById(db, input.id);

      if (
         !form ||
         form.organizationId !== organizationId ||
         form.teamId !== teamId
      ) {
         throw new ORPCError("NOT_FOUND", {
            message: "Form not found.",
         });
      }

      await deleteForm(db, input.id);

      try {
         await emitFormDeleted(
            createEmitFn(db, posthog),
            { organizationId, userId, teamId },
            { formId: input.id },
         );
      } catch {
         // Event emission must not break the main flow
      }

      return { success: true };
   });

/**
 * Get paginated submissions for a form (verifies form ownership and team access)
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
      const { organizationId, teamId, db } = context;

      const form = await getFormById(db, input.formId);

      if (
         !form ||
         form.organizationId !== organizationId ||
         form.teamId !== teamId
      ) {
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
