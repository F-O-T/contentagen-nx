import { AppError, propagateError } from "@packages/utils/errors";
import { desc, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import {
   type Experiment,
   type ExperimentVariant,
   experiments,
   experimentVariants,
   type NewExperiment,
   type NewExperimentVariant,
} from "../schemas/experiments";

export async function createExperiment(
   db: DatabaseInstance,
   data: NewExperiment,
): Promise<Experiment> {
   try {
      const [result] = await db.insert(experiments).values(data).returning();
      if (!result) throw new Error("No result returned");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create experiment: ${(err as Error).message}`,
      );
   }
}

export async function getExperimentById(
   db: DatabaseInstance,
   id: string,
): Promise<(Experiment & { variants: ExperimentVariant[] }) | undefined> {
   try {
      return db.query.experiments.findFirst({
         where: (e, { eq }) => eq(e.id, id),
         with: { variants: true },
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get experiment: ${(err as Error).message}`,
      );
   }
}

export async function listExperimentsByTeam(
   db: DatabaseInstance,
   teamId: string,
): Promise<(Experiment & { variants: ExperimentVariant[] })[]> {
   try {
      return db.query.experiments.findMany({
         where: (e, { eq }) => eq(e.teamId, teamId),
         with: { variants: true },
         orderBy: (e) => [desc(e.createdAt)],
      });
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to list experiments: ${(err as Error).message}`,
      );
   }
}

export async function updateExperiment(
   db: DatabaseInstance,
   id: string,
   data: Partial<
      Pick<
         Experiment,
         | "name"
         | "hypothesis"
         | "targetType"
         | "goal"
         | "status"
         | "startedAt"
         | "concludedAt"
         | "winnerId"
      >
   >,
): Promise<Experiment> {
   try {
      const result = await db
         .update(experiments)
         .set({ ...data, updatedAt: new Date() })
         .where(eq(experiments.id, id))
         .returning();

      if (!result.length) {
         throw AppError.database("Experiment not found");
      }
      return result[0] as Experiment;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update experiment: ${(err as Error).message}`,
      );
   }
}

export async function deleteExperiment(
   db: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await db
         .delete(experiments)
         .where(eq(experiments.id, id))
         .returning();

      if (!result.length) {
         throw AppError.database("Experiment not found");
      }
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete experiment: ${(err as Error).message}`,
      );
   }
}

export async function addVariant(
   db: DatabaseInstance,
   data: NewExperimentVariant,
): Promise<ExperimentVariant> {
   try {
      const [result] = await db
         .insert(experimentVariants)
         .values(data)
         .returning();
      if (!result) throw new Error("No result returned");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to add variant: ${(err as Error).message}`,
      );
   }
}

export async function removeVariant(
   db: DatabaseInstance,
   variantId: string,
): Promise<void> {
   try {
      const result = await db
         .delete(experimentVariants)
         .where(eq(experimentVariants.id, variantId))
         .returning();

      if (!result.length) {
         throw AppError.database("Variant not found");
      }
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to remove variant: ${(err as Error).message}`,
      );
   }
}

export async function getVariantsByExperiment(
   db: DatabaseInstance,
   experimentId: string,
): Promise<ExperimentVariant[]> {
   try {
      return db
         .select()
         .from(experimentVariants)
         .where(eq(experimentVariants.experimentId, experimentId));
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get variants: ${(err as Error).message}`,
      );
   }
}
