import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../server";

/**
 * Get the current user's session
 */
export const getSession = publicProcedure.handler(async ({ context }) => {
   const { auth, headers } = context;
   return auth.api.getSession({ headers });
});

/**
 * List all active sessions for the current user
 */
export const listSessions = protectedProcedure
   .handler(async ({ context }) => {
      const { auth, headers } = context;

      const sessions = await auth.api.listSessions({
         headers,
      });

      return sessions;
   });

/**
 * Revoke a specific session by token
 */
export const revokeSessionByToken = protectedProcedure
   .input(z.object({ token: z.string() }))
   .handler(async ({ context, input }) => {
      const { auth, headers } = context;

      await auth.api.revokeSession({
         headers,
         body: { token: input.token },
      });

      return { success: true };
   });

/**
 * Revoke all other sessions except the current one
 */
export const revokeOtherSessions = protectedProcedure.handler(
   async ({ context }) => {
      const { auth, headers } = context;

      await auth.api.revokeOtherSessions({
         headers,
      });

      return { success: true };
   },
);

/**
 * Revoke all sessions (including the current one)
 */
export const revokeSessions = protectedProcedure.handler(async ({ context }) => {
   const { auth, headers } = context;

   await auth.api.revokeSessions({
      headers,
   });

   return { success: true };
});
