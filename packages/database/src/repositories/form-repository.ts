import { AppError, propagateError } from "@packages/utils/errors";
import { count, desc, eq, sql } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   formSubmissions,
   forms,
   type NewForm,
   type NewFormSubmission,
} from "../schemas/forms";

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export async function createForm(db: DatabaseInstance, data: NewForm) {
   try {
      const [form] = await db.insert(forms).values(data).returning();
      return form;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create form");
   }
}

/**
 * List forms by organization (admin/org-wide view)
 */
export async function listForms(db: DatabaseInstance, organizationId: string) {
   try {
      const result = await db
         .select({
            id: forms.id,
            organizationId: forms.organizationId,
            teamId: forms.teamId,
            name: forms.name,
            description: forms.description,
            fields: forms.fields,
            settings: forms.settings,
            isActive: forms.isActive,
            createdAt: forms.createdAt,
            updatedAt: forms.updatedAt,
            submissionCount:
               sql<number>`cast(count(${formSubmissions.id}) as int)`.as(
                  "submission_count",
               ),
         })
         .from(forms)
         .leftJoin(formSubmissions, eq(forms.id, formSubmissions.formId))
         .where(eq(forms.organizationId, organizationId))
         .groupBy(forms.id)
         .orderBy(desc(forms.createdAt));

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list forms");
   }
}

/**
 * List forms by team (team-scoped view)
 */
export async function listFormsByTeam(db: DatabaseInstance, teamId: string) {
   try {
      const result = await db
         .select({
            id: forms.id,
            organizationId: forms.organizationId,
            teamId: forms.teamId,
            name: forms.name,
            description: forms.description,
            fields: forms.fields,
            settings: forms.settings,
            isActive: forms.isActive,
            createdAt: forms.createdAt,
            updatedAt: forms.updatedAt,
            submissionCount:
               sql<number>`cast(count(${formSubmissions.id}) as int)`.as(
                  "submission_count",
               ),
         })
         .from(forms)
         .leftJoin(formSubmissions, eq(forms.id, formSubmissions.formId))
         .where(eq(forms.teamId, teamId))
         .groupBy(forms.id)
         .orderBy(desc(forms.createdAt));

      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list forms by team");
   }
}

/**
 * Count forms by team
 */
export async function countFormsByTeam(db: DatabaseInstance, teamId: string) {
   try {
      const [result] = await db
         .select({ count: count() })
         .from(forms)
         .where(eq(forms.teamId, teamId));

      return result?.count ?? 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to count forms by team");
   }
}

export async function getFormById(db: DatabaseInstance, formId: string) {
   try {
      const [form] = await db
         .select()
         .from(forms)
         .where(eq(forms.id, formId))
         .limit(1);

      return form ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get form");
   }
}

export async function updateForm(
   db: DatabaseInstance,
   formId: string,
   data: Partial<
      Pick<
         NewForm,
         | "name"
         | "description"
         | "fields"
         | "settings"
         | "isActive"
         | "title"
         | "subtitle"
         | "icon"
         | "buttonText"
         | "layout"
      >
   >,
) {
   try {
      const [updated] = await db
         .update(forms)
         .set(data)
         .where(eq(forms.id, formId))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update form");
   }
}

export async function deleteForm(db: DatabaseInstance, formId: string) {
   try {
      await db.delete(forms).where(eq(forms.id, formId));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete form");
   }
}

// ---------------------------------------------------------------------------
// Form Submissions
// ---------------------------------------------------------------------------

export async function getFormSubmissions(
   db: DatabaseInstance,
   formId: string,
   options: { offset?: number; limit?: number } = {},
) {
   try {
      const { offset = 0, limit = 50 } = options;

      return await db
         .select()
         .from(formSubmissions)
         .where(eq(formSubmissions.formId, formId))
         .orderBy(desc(formSubmissions.submittedAt))
         .offset(offset)
         .limit(limit);
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get form submissions");
   }
}

export async function countFormSubmissions(
   db: DatabaseInstance,
   formId: string,
) {
   try {
      const [result] = await db
         .select({ count: count() })
         .from(formSubmissions)
         .where(eq(formSubmissions.formId, formId));

      return result?.count ?? 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to count form submissions");
   }
}

export async function createFormSubmission(
   db: DatabaseInstance,
   data: NewFormSubmission,
) {
   try {
      const [submission] = await db
         .insert(formSubmissions)
         .values(data)
         .returning();
      return submission;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create form submission");
   }
}
