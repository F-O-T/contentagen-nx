import { exportLog } from "../schemas/export-log";
import type { ExportLog, ExportLogInsert } from "../schemas/export-log";
import type { DatabaseInstance } from "../client";
import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";

export async function createExportLog(
   dbClient: DatabaseInstance,
   data: ExportLogInsert,
): Promise<ExportLog> {
   try {
      const result = await dbClient.insert(exportLog).values(data).returning();
      const created = result?.[0];
      if (!created) throw AppError.database("Export log not created");
      return created;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create export log: ${(err as Error).message}`,
      );
   }
}

export async function getExportLogById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<ExportLog> {
   try {
      const result = await dbClient.query.exportLog.findFirst({
         where: eq(exportLog.id, id),
      });
      if (!result) throw AppError.database("Export log not found");
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get export log: ${(err as Error).message}`,
      );
   }
}

export async function updateExportLog(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<ExportLogInsert>,
): Promise<ExportLog> {
   try {
      const result = await dbClient
         .update(exportLog)
         .set(data)
         .where(eq(exportLog.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw AppError.database("Export log not found");
      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update export log: ${(err as Error).message}`,
      );
   }
}

export async function deleteExportLog(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(exportLog)
         .where(eq(exportLog.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw AppError.database("Export log not found");
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete export log: ${(err as Error).message}`,
      );
   }
}

export async function listExportLogs(
   dbClient: DatabaseInstance,
): Promise<ExportLog[]> {
   try {
      return await dbClient.query.exportLog.findMany();
   } catch (err) {
      throw AppError.database(
         `Failed to list export logs: ${(err as Error).message}`,
      );
   }
}
