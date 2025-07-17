import { exportLog } from "../schemas/export-log";
import type { ExportLog, ExportLogInsert } from "../schemas/export-log";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

export async function createExportLog(
  dbClient: DatabaseInstance,
  data: ExportLogInsert,
): Promise<ExportLog> {
  try {
    const result = await dbClient.insert(exportLog).values(data).returning();
    const created = result?.[0];
    if (!created) throw new NotFoundError("Export log not created");
    return created;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
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
    if (!result) throw new NotFoundError("Export log not found");
    return result;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
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
    if (!updated) throw new NotFoundError("Export log not found");
    return updated;
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
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
    if (!deleted) throw new NotFoundError("Export log not found");
  } catch (err) {
    if (err instanceof NotFoundError) throw err;
    throw new DatabaseError(
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
    throw new DatabaseError(
      `Failed to list export logs: ${(err as Error).message}`,
    );
  }
}
