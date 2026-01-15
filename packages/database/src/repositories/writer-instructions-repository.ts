import { AppError, propagateError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import type {
   CreateInstructionMemory,
   InstructionMemoryItem,
   UpdateInstructionMemory,
} from "../schemas/instruction-memory";
import { writer } from "../schemas/writer";

/**
 * Get all instruction memories for a writer.
 */
export async function getWriterInstructions(
   dbClient: DatabaseInstance,
   writerId: string,
): Promise<InstructionMemoryItem[]> {
   try {
      const result = await dbClient.query.writer.findFirst({
         where: (w, { eq }) => eq(w.id, writerId),
         columns: { instructionMemories: true },
      });
      return (result?.instructionMemories ?? []) as InstructionMemoryItem[];
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to get writer instructions: ${(err as Error).message}`,
      );
   }
}

/**
 * Add a new instruction memory to a writer.
 */
export async function addWriterInstruction(
   dbClient: DatabaseInstance,
   writerId: string,
   data: CreateInstructionMemory,
): Promise<InstructionMemoryItem> {
   try {
      const existing = await getWriterInstructions(dbClient, writerId);

      const now = new Date().toISOString();
      const newInstruction: InstructionMemoryItem = {
         id: crypto.randomUUID(),
         title: data.title,
         content: data.content,
         enabled: data.enabled ?? true,
         order: data.order ?? existing.length,
         createdAt: now,
         updatedAt: now,
      };

      const updated = [...existing, newInstruction];

      await dbClient
         .update(writer)
         .set({ instructionMemories: updated })
         .where(eq(writer.id, writerId));

      return newInstruction;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to add writer instruction: ${(err as Error).message}`,
      );
   }
}

/**
 * Update an existing instruction memory in a writer.
 */
export async function updateWriterInstruction(
   dbClient: DatabaseInstance,
   writerId: string,
   instructionId: string,
   data: UpdateInstructionMemory,
): Promise<InstructionMemoryItem> {
   try {
      const existing = await getWriterInstructions(dbClient, writerId);

      const index = existing.findIndex((i) => i.id === instructionId);
      if (index === -1) {
         throw AppError.notFound("Instruction not found");
      }

      const current = existing[index];
      if (!current) {
         throw AppError.notFound("Instruction not found");
      }

      const updated: InstructionMemoryItem = {
         id: current.id,
         title: data.title ?? current.title,
         content: data.content ?? current.content,
         enabled: data.enabled ?? current.enabled,
         order: data.order ?? current.order,
         createdAt: current.createdAt,
         updatedAt: new Date().toISOString(),
      };

      const newArray = [...existing];
      newArray[index] = updated;

      await dbClient
         .update(writer)
         .set({ instructionMemories: newArray })
         .where(eq(writer.id, writerId));

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to update writer instruction: ${(err as Error).message}`,
      );
   }
}

/**
 * Delete an instruction memory from a writer.
 */
export async function deleteWriterInstruction(
   dbClient: DatabaseInstance,
   writerId: string,
   instructionId: string,
): Promise<void> {
   try {
      const existing = await getWriterInstructions(dbClient, writerId);

      const filtered = existing.filter((i) => i.id !== instructionId);

      if (filtered.length === existing.length) {
         throw AppError.notFound("Instruction not found");
      }

      // Re-normalize order values
      const normalized = filtered.map((item, idx) => ({
         ...item,
         order: idx,
      }));

      await dbClient
         .update(writer)
         .set({ instructionMemories: normalized })
         .where(eq(writer.id, writerId));
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to delete writer instruction: ${(err as Error).message}`,
      );
   }
}

/**
 * Reorder instruction memories for a writer.
 * @param orderedIds Array of instruction IDs in the desired order
 */
export async function reorderWriterInstructions(
   dbClient: DatabaseInstance,
   writerId: string,
   orderedIds: string[],
): Promise<InstructionMemoryItem[]> {
   try {
      const existing = await getWriterInstructions(dbClient, writerId);

      // Build a map for quick lookup
      const byId = new Map(existing.map((i) => [i.id, i]));

      // Reorder based on provided IDs
      const reordered: InstructionMemoryItem[] = [];
      for (let idx = 0; idx < orderedIds.length; idx++) {
         const id = orderedIds[idx];
         if (!id) continue;
         const item = byId.get(id);
         if (item) {
            reordered.push({
               id: item.id,
               title: item.title,
               content: item.content,
               enabled: item.enabled,
               order: idx,
               createdAt: item.createdAt,
               updatedAt: new Date().toISOString(),
            });
         }
      }

      // Add any items that weren't in orderedIds at the end
      const orderedIdSet = new Set(orderedIds);
      for (const item of existing) {
         if (!orderedIdSet.has(item.id)) {
            reordered.push({
               id: item.id,
               title: item.title,
               content: item.content,
               enabled: item.enabled,
               order: reordered.length,
               createdAt: item.createdAt,
               updatedAt: new Date().toISOString(),
            });
         }
      }

      await dbClient
         .update(writer)
         .set({ instructionMemories: reordered })
         .where(eq(writer.id, writerId));

      return reordered;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to reorder writer instructions: ${(err as Error).message}`,
      );
   }
}

/**
 * Toggle the enabled status of an instruction memory.
 */
export async function toggleWriterInstructionEnabled(
   dbClient: DatabaseInstance,
   writerId: string,
   instructionId: string,
): Promise<InstructionMemoryItem> {
   try {
      const existing = await getWriterInstructions(dbClient, writerId);

      const index = existing.findIndex((i) => i.id === instructionId);
      if (index === -1) {
         throw AppError.notFound("Instruction not found");
      }

      const current = existing[index];
      if (!current) {
         throw AppError.notFound("Instruction not found");
      }

      const updated: InstructionMemoryItem = {
         id: current.id,
         title: current.title,
         content: current.content,
         enabled: !current.enabled,
         order: current.order,
         createdAt: current.createdAt,
         updatedAt: new Date().toISOString(),
      };

      const newArray = [...existing];
      newArray[index] = updated;

      await dbClient
         .update(writer)
         .set({ instructionMemories: newArray })
         .where(eq(writer.id, writerId));

      return updated;
   } catch (err) {
      propagateError(err);
      throw AppError.database(
         `Failed to toggle writer instruction: ${(err as Error).message}`,
      );
   }
}
