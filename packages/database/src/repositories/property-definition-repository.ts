import { AppError, propagateError } from "@packages/utils/errors";
import { desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type NewPropertyDefinition,
   propertyDefinitions,
} from "../schemas/property-definitions";

export async function createPropertyDefinition(
   db: DatabaseInstance,
   data: Omit<NewPropertyDefinition, "id" | "createdAt" | "updatedAt">,
) {
   try {
      const [definition] = await db
         .insert(propertyDefinitions)
         .values(data)
         .returning();

      return definition;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to create property definition");
   }
}

export async function listPropertyDefinitions(
   db: DatabaseInstance,
   organizationId: string,
) {
   try {
      return await db
         .select()
         .from(propertyDefinitions)
         .where(eq(propertyDefinitions.organizationId, organizationId))
         .orderBy(desc(propertyDefinitions.createdAt));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to list property definitions");
   }
}

export async function getPropertyDefinition(db: DatabaseInstance, id: string) {
   try {
      const [definition] = await db
         .select()
         .from(propertyDefinitions)
         .where(eq(propertyDefinitions.id, id))
         .limit(1);

      return definition ?? null;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to get property definition");
   }
}

export async function updatePropertyDefinition(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<
         NewPropertyDefinition,
         "name" | "type" | "description" | "eventNames" | "isNumerical" | "tags"
      >
   >,
) {
   try {
      const [updated] = await db
         .update(propertyDefinitions)
         .set(data)
         .where(eq(propertyDefinitions.id, id))
         .returning();

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to update property definition");
   }
}

export async function deletePropertyDefinition(
   db: DatabaseInstance,
   id: string,
) {
   try {
      await db
         .delete(propertyDefinitions)
         .where(eq(propertyDefinitions.id, id));
   } catch (err) {
      propagateError(err);
      throw AppError.database("Failed to delete property definition");
   }
}
