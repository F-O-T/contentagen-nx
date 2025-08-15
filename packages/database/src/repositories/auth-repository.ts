import type { DatabaseInstance } from "../client";
import { DatabaseError, NotFoundError } from "@packages/errors";

export async function findMemberByUserId(
   dbClient: DatabaseInstance,
   userId: string,
) {
   try {
      const result = await dbClient.query.member.findFirst({
         where: (user, { eq }) => eq(user.id, userId),
      });
      if (!result) throw new NotFoundError("User not found");
      return result;
   } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new DatabaseError(
         `Failed to find user by id: ${(err as Error).message}`,
      );
   }
}
