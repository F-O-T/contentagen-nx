import { ORPCError } from "@orpc/server";
import { env as serverEnv } from "@packages/environment/server";
import {
   generatePresignedPutUrl,
   getMinioClient,
} from "@packages/files/client";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Verify the user's current password
 */
export const verifyPassword = protectedProcedure
   .input(z.object({ password: z.string() }))
   .handler(async ({ context, input }) => {
      const { auth, headers } = context;

      try {
         // Use Better Auth's verify password endpoint
         await auth.api.verifyPassword({
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
      const accounts = await auth.api.listUserAccounts({ headers });
      const hasCredential = accounts.some(
         (account) => account.providerId === "credential",
      );
      return { hasPassword: hasCredential };
   } catch (error) {
      // Convert Better Auth API errors to ORPCError
      if (error && typeof error === "object" && "status" in error) {
         const apiError = error as { status: string; statusCode?: number };

         if (
            apiError.status === "UNAUTHORIZED" ||
            apiError.statusCode === 401
         ) {
            throw new ORPCError("UNAUTHORIZED", {
               message: "Authentication required to check password status",
            });
         }

         if (apiError.status === "FORBIDDEN" || apiError.statusCode === 403) {
            throw new ORPCError("FORBIDDEN", {
               message: "Insufficient permissions to check password status",
            });
         }
      }

      // For other errors, return false as fallback
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
         const accounts = await auth.api.listUserAccounts({ headers });
         return accounts.map((account) => ({
            providerId: account.providerId,
            accountId: account.accountId,
            createdAt: account.createdAt,
         }));
      } catch (error) {
         // Convert Better Auth API errors to ORPCError
         if (error && typeof error === "object" && "status" in error) {
            const apiError = error as { status: string; statusCode?: number };

            if (
               apiError.status === "UNAUTHORIZED" ||
               apiError.statusCode === 401
            ) {
               throw new ORPCError("UNAUTHORIZED", {
                  message: "Authentication required to access linked accounts",
               });
            }

            if (
               apiError.status === "FORBIDDEN" ||
               apiError.statusCode === 403
            ) {
               throw new ORPCError("FORBIDDEN", {
                  message: "Insufficient permissions to access linked accounts",
               });
            }
         }

         // For other errors, return empty array as fallback
         return [];
      }
   },
);

/**
 * Set password for the first time (magic link users only).
 * Uses Better Auth's setPassword endpoint which creates a credential account
 * if one doesn't already exist.
 */
export const setPassword = protectedProcedure
   .input(z.object({ newPassword: z.string().min(8) }))
   .handler(async ({ context, input }) => {
      const { auth, headers } = context;

      try {
         await auth.api.setPassword({
            headers,
            body: { newPassword: input.newPassword },
         });
         return { success: true };
      } catch (error) {
         if (error && typeof error === "object" && "message" in error) {
            const msg = (error as { message: string }).message;
            if (msg === "user already has a password") {
               throw new ORPCError("BAD_REQUEST", {
                  message: "Usuário já possui uma senha definida",
               });
            }
         }
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Erro ao definir senha",
         });
      }
   });

/**
 * Generate presigned URL for user avatar upload
 */
export const generateAvatarUploadUrl = protectedProcedure
   .input(
      z.object({
         fileExtension: z
            .string()
            .regex(/^[a-zA-Z0-9]{1,10}$/, "Invalid file extension"),
      }),
   )
   .handler(async ({ context, input }) => {
      const { userId } = context;

      try {
         const minioClient = getMinioClient(serverEnv);
         const bucketName = "user-avatars";
         const fileName = `avatar-${userId}-${crypto.randomUUID()}.${input.fileExtension}`;

         const presignedUrl = await generatePresignedPutUrl(
            fileName,
            bucketName,
            minioClient,
            300, // 5 minutes
         );

         return {
            presignedUrl,
            fileName,
            publicUrl: `/api/files/${bucketName}/${fileName}`,
         };
      } catch (error) {
         console.error("Failed to generate avatar upload URL:", error);
         throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to generate upload URL",
         });
      }
   });
