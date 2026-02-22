import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * List all API keys for the current organization
 */
export const list = protectedProcedure.handler(async ({ context }) => {
   const { auth, headers, organizationId } = context;

   try {
      const keys = await auth.api.listApiKeys({
         headers,
      });

      // Filter to show only keys for current organization
      return keys.filter(
         (key) => key.metadata?.organizationId === organizationId,
      );
   } catch (error) {
      // Convert Better Auth API errors to ORPCError
      if (error && typeof error === "object" && "status" in error) {
         const apiError = error as { status: string; statusCode?: number };

         if (
            apiError.status === "UNAUTHORIZED" ||
            apiError.statusCode === 401
         ) {
            throw new ORPCError("UNAUTHORIZED", {
               message: "Authentication required to list API keys",
            });
         }

         if (apiError.status === "FORBIDDEN" || apiError.statusCode === 403) {
            throw new ORPCError("FORBIDDEN", {
               message: "Insufficient permissions to list API keys",
            });
         }
      }

      // Re-throw ORPCErrors as-is
      if (error instanceof ORPCError) {
         throw error;
      }

      // Convert unknown errors to INTERNAL_SERVER_ERROR
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
         message: "Failed to list API keys",
      });
   }
});

/**
 * Get a specific API key by ID
 */
export const get = protectedProcedure
   .input(
      z.object({
         keyId: z.string(),
      }),
   )
   .handler(async ({ context, input }) => {
      const { auth, headers, organizationId } = context;

      try {
         const key = await auth.api.getApiKey({
            query: { id: input.keyId },
            headers,
         });

         if (key?.metadata?.organizationId !== organizationId) {
            throw new ORPCError("FORBIDDEN", {
               message: "API key not found",
            });
         }

         return key;
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to access API key",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to access API key",
               });
            }
         }

         // Re-throw ORPCErrors as-is
         if (error instanceof ORPCError) {
            throw error;
         }

         // Convert unknown errors to INTERNAL_SERVER_ERROR
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to retrieve API key",
         });
      }
   });
