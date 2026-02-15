import { AppError, propagateError } from "@packages/utils/errors";
import { count, eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { type WriterInsert, writer } from "../schemas/writer";

export async function createWriter(
   dbClient: DatabaseInstance,
   data: WriterInsert,
) {
   try {
      const result = await dbClient.insert(writer).values(data).returning();
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to create writer: ${(err as Error).message}`,
      );
   }
}

export async function getWriterById(
   dbClient: DatabaseInstance,
   writerId: string,
) {
   try {
      const result = await dbClient.query.writer.findFirst({
         where: (writer, { eq }) => eq(writer.id, writerId),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get writer: ${(err as Error).message}`,
      );
   }
}

export async function getWritersByOrganizationId(
   dbClient: DatabaseInstance,
   organizationId: string,
) {
   try {
      const result = await dbClient.query.writer.findMany({
         where: (writer, { eq }) => eq(writer.organizationId, organizationId),
         orderBy: (writer, { desc }) => desc(writer.createdAt),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get writers: ${(err as Error).message}`,
      );
   }
}

export async function getWritersByTeamId(
   dbClient: DatabaseInstance,
   teamId: string,
) {
   try {
      const result = await dbClient.query.writer.findMany({
         where: (writer, { eq }) => eq(writer.teamId, teamId),
         orderBy: (writer, { desc }) => desc(writer.createdAt),
      });
      return result;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get writers by team: ${(err as Error).message}`,
      );
   }
}

export async function updateWriter(
   dbClient: DatabaseInstance,
   writerId: string,
   data: Partial<WriterInsert>,
) {
   try {
      const result = await dbClient
         .update(writer)
         .set(data)
         .where(eq(writer.id, writerId))
         .returning();

      if (!result.length) {
         throw AppError.database("Writer not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update writer: ${(err as Error).message}`,
      );
   }
}

export async function deleteWriter(
   dbClient: DatabaseInstance,
   writerId: string,
) {
   try {
      const result = await dbClient
         .delete(writer)
         .where(eq(writer.id, writerId))
         .returning();

      if (!result.length) {
         throw AppError.database("Writer not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete writer: ${(err as Error).message}`,
      );
   }
}

export async function updateWriterLastGenerated(
   dbClient: DatabaseInstance,
   writerId: string,
) {
   try {
      const result = await dbClient
         .update(writer)
         .set({ lastGeneratedAt: new Date() })
         .where(eq(writer.id, writerId))
         .returning();

      if (!result.length) {
         throw AppError.database("Writer not found");
      }
      return result[0];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update writer last generated: ${(err as Error).message}`,
      );
   }
}

export async function getTotalWriters(
   dbClient: DatabaseInstance,
   options: { organizationId: string; userId?: string },
) {
   try {
      const result = await dbClient
         .select({ count: count() })
         .from(writer)
         .where(eq(writer.organizationId, options.organizationId));

      return result[0]?.count ?? 0;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get total writers: ${(err as Error).message}`,
      );
   }
}
