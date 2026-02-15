import { AppError, propagateError } from "@packages/utils/errors";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { annotations, type NewAnnotation } from "../schemas/annotations";

export async function createAnnotation(
   db: DatabaseInstance,
   data: Omit<NewAnnotation, "id" | "createdAt">,
) {
   try {
      const [annotation] = await db
         .insert(annotations)
         .values(data)
         .returning();

      return annotation;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create annotation");
   }
}

export async function listAnnotations(
   db: DatabaseInstance,
   organizationId: string,
   options: { page?: number; limit?: number; from?: Date; to?: Date } = {},
) {
   try {
      const { page = 1, limit = 50, from, to } = options;
      const offset = (page - 1) * limit;

      const conditions = [eq(annotations.organizationId, organizationId)];

      if (from) {
         conditions.push(gte(annotations.date, from));
      }
      if (to) {
         conditions.push(lte(annotations.date, to));
      }

      return await db
         .select()
         .from(annotations)
         .where(and(...conditions))
         .orderBy(desc(annotations.date))
         .offset(offset)
         .limit(limit);
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list annotations");
   }
}

export async function getAnnotation(db: DatabaseInstance, id: string) {
   try {
      const [annotation] = await db
         .select()
         .from(annotations)
         .where(eq(annotations.id, id))
         .limit(1);

      return annotation ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get annotation");
   }
}

export async function updateAnnotation(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<
         NewAnnotation,
         "title" | "description" | "date" | "scope" | "metadata"
      >
   >,
) {
   try {
      const [updated] = await db
         .update(annotations)
         .set(data)
         .where(eq(annotations.id, id))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update annotation");
   }
}

export async function deleteAnnotation(db: DatabaseInstance, id: string) {
   try {
      await db.delete(annotations).where(eq(annotations.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete annotation");
   }
}
