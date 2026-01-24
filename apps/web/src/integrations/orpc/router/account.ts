import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Verify the user's current password
 */
export const verifyPassword = protectedProcedure
   .input(z.object({ password: z.string() }))
   .handler(async ({ context, input }) => {
      const { auth, headers, userId } = context;

      try {
         // Use Better Auth's verify password endpoint
         const result = await auth.api.verifyPassword({
            headers,
            body: { password: input.password },
         });
         return { valid: true };
      } catch {
         return { valid: false };
      }
   });

/**
 * Check if user has a password set (vs. OAuth-only)
 */
export const hasPassword = protectedProcedure.handler(async ({ context }) => {
   const { auth, headers } = context;

   try {
      const accounts = await auth.api.listAccounts({ headers });
      const hasCredential = accounts.some(
         (account) => account.providerId === "credential",
      );
      return { hasPassword: hasCredential };
   } catch {
      return { hasPassword: false };
   }
});

/**
 * Get linked accounts (OAuth providers)
 */
export const getLinkedAccounts = protectedProcedure.handler(
   async ({ context }) => {
      const { auth, headers } = context;

      try {
         const accounts = await auth.api.listAccounts({ headers });
         return accounts.map((account) => ({
            providerId: account.providerId,
            accountId: account.accountId,
            createdAt: account.createdAt,
         }));
      } catch {
         return [];
      }
   },
);
