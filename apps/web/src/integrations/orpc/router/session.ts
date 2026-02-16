import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure, publicProcedure } from "../server";

/**
 * Get the current user's session
 */
export const getSession = publicProcedure.handler(async ({ context }) => {
   const { auth, headers } = context;

   try {
      return auth.api.getSession({ headers });
   } catch (error) {
      // Convert Better Auth API errors to ORPCError
      if (error && typeof error === "object" && "status" in error) {
         const apiError = error as { status: string; statusCode?: number };

         if (
            apiError.status === "UNAUTHORIZED" ||
            apiError.statusCode === 401
         ) {
            throw new ORPCError("UNAUTHORIZED", {
               message: "Authentication required",
            });
         }
      }

      // Re-throw ORPCErrors as-is
      if (error instanceof ORPCError) {
         throw error;
      }

      // Convert unknown errors to INTERNAL_SERVER_ERROR
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
         message: "Failed to retrieve session",
      });
   }
});

/**
 * List all active sessions for the current user
 */
export const listSessions = protectedProcedure.handler(async ({ context }) => {
   const { auth, headers } = context;

   try {
      const sessions = await auth.api.listSessions({
         headers,
      });

      return sessions;
   } catch (error) {
      // Convert Better Auth API errors to ORPCError
      if (error && typeof error === "object" && "status" in error) {
         const apiError = error as { status: string; statusCode?: number };

         if (
            apiError.status === "UNAUTHORIZED" ||
            apiError.statusCode === 401
         ) {
            throw new ORPCError("UNAUTHORIZED", {
               message: "Authentication required to list sessions",
            });
         }

         if (apiError.status === "FORBIDDEN" || apiError.statusCode === 403) {
            throw new ORPCError("FORBIDDEN", {
               message: "Insufficient permissions to list sessions",
            });
         }
      }

      // Re-throw ORPCErrors as-is
      if (error instanceof ORPCError) {
         throw error;
      }

      // Convert unknown errors to INTERNAL_SERVER_ERROR
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
         message: "Failed to list sessions",
      });
   }
});

/**
 * Revoke a specific session by token
 */
export const revokeSessionByToken = protectedProcedure
   .input(z.object({ token: z.string() }))
   .handler(async ({ context, input }) => {
      const { auth, headers } = context;

      try {
         await auth.api.revokeSession({
            headers,
            body: { token: input.token },
         });

         return { success: true };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to revoke session",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to revoke session",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to revoke session",
         });
      }
   });

/**
 * Revoke all other sessions except the current one
 */
export const revokeOtherSessions = protectedProcedure.handler(
   async ({ context }) => {
      const { auth, headers } = context;

      try {
         await auth.api.revokeOtherSessions({
            headers,
         });

         return { success: true };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to revoke sessions",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to revoke sessions",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to revoke other sessions",
         });
      }
   },
);

/**
 * Revoke all sessions (including the current one)
 */
export const revokeSessions = protectedProcedure.handler(
   async ({ context }) => {
      const { auth, headers } = context;

      try {
         await auth.api.revokeSessions({
            headers,
         });

         return { success: true };
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to revoke all sessions",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to revoke all sessions",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to revoke all sessions",
         });
      }
   },
);
