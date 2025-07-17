import { waitlist } from "../schemas/waitlist";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";
import { eq } from "drizzle-orm";

export type WaitlistSelect = InferSelectModel<typeof waitlist>;
export type WaitlistInsert = InferInsertModel<typeof waitlist>;

export async function createWaitlist(
   dbClient: DatabaseInstance,
   data: WaitlistInsert,
): Promise<WaitlistSelect> {
   try {
      const result = await dbClient.insert(waitlist).values(data).returning();
      const created = result?.[0];
      if (!created) throw new NotFoundError("Waitlist entry not created");
      return created;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to create waitlist entry: ${(err as Error).message}`,
      );
   }
}

export async function getWaitlistByEmail(
   dbClient: DatabaseInstance,
   email: string,
): Promise<WaitlistSelect | null> {
   try {
      const result = await dbClient.query.waitlist.findFirst({
         where: eq(waitlist.email, email),
      });
      return result ?? null;
   } catch (err) {
      throw new DatabaseError(
         `Failed to get waitlist entry by email: ${(err as Error).message}`,
      );
   }
}

export async function getWaitlistById(
   dbClient: DatabaseInstance,
   id: string,
): Promise<WaitlistSelect> {
   try {
      const result = await dbClient.query.waitlist.findFirst({
         where: eq(waitlist.id, id),
      });
      if (!result) throw new NotFoundError("Waitlist entry not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to get waitlist entry: ${(err as Error).message}`,
      );
   }
}

export async function updateWaitlist(
   dbClient: DatabaseInstance,
   id: string,
   data: Partial<WaitlistInsert>,
): Promise<WaitlistSelect> {
   try {
      const result = await dbClient
         .update(waitlist)
         .set(data)
         .where(eq(waitlist.id, id))
         .returning();
      const updated = result?.[0];
      if (!updated) throw new NotFoundError("Waitlist entry not found");
      return updated;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to update waitlist entry: ${(err as Error).message}`,
      );
   }
}

export async function deleteWaitlist(
   dbClient: DatabaseInstance,
   id: string,
): Promise<void> {
   try {
      const result = await dbClient
         .delete(waitlist)
         .where(eq(waitlist.id, id))
         .returning();
      const deleted = result?.[0];
      if (!deleted) throw new NotFoundError("Waitlist entry not found");
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to delete waitlist entry: ${(err as Error).message}`,
      );
   }
}

export async function listWaitlists(
   dbClient: DatabaseInstance,
): Promise<WaitlistSelect[]> {
   try {
      return await dbClient.query.waitlist.findMany();
   } catch (err) {
      throw new DatabaseError(
         `Failed to list waitlist entries: ${(err as Error).message}`,
      );
   }
}
