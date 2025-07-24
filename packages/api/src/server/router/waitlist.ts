import { TRPCError } from "@trpc/server";
import {
   createWaitlist,
   updateWaitlist,
   deleteWaitlist,
   getWaitlistByEmail,
} from "@packages/database/repositories/waitlist-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { publicProcedure, router } from "../trpc";
import { Type } from "@sinclair/typebox";
import { wrap } from "@typeschema/typebox";

import {
   WaitlistInsertSchema,
   WaitlistUpdateSchema,
} from "@packages/database/schema";

const JoinInput = WaitlistInsertSchema;
const UpdateInput = WaitlistUpdateSchema;

const DeleteInput = Type.Object({
   email: Type.String({ format: "email" }),
});

export const waitlistRouter = router({
   join: publicProcedure
      .input(wrap(JoinInput))
      .mutation(async ({ ctx, input }) => {
         try {
            await createWaitlist(ctx.db, input);
            return { success: true };
         } catch (err) {
            if (
               err instanceof DatabaseError &&
               err.message.includes("already")
            ) {
               throw new TRPCError({
                  code: "CONFLICT",
                  message: err.message,
               });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   update: publicProcedure
      .input(wrap(UpdateInput))
      .mutation(async ({ ctx, input }) => {
         const { email, ...updateFields } = input;
         if (Object.keys(updateFields).length === 0) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "No fields to update.",
            });
         }
         if (!email) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "Email is required for updating waitlist entry.",
            });
         }
         try {
            const entry = await getWaitlistByEmail(ctx.db, email);
            if (!entry) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "No waitlist entry found for this email.",
               });
            }
            await updateWaitlist(ctx.db, entry.id, updateFields);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
   delete: publicProcedure
      .input(wrap(DeleteInput))
      .mutation(async ({ ctx, input }) => {
         const { email } = input;
         try {
            const entry = await getWaitlistByEmail(ctx.db, email);
            if (!entry) {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "No waitlist entry found for this email.",
               });
            }
            await deleteWaitlist(ctx.db, entry.id);
            return { success: true };
         } catch (err) {
            if (err instanceof NotFoundError) {
               throw new TRPCError({ code: "NOT_FOUND", message: err.message });
            }
            if (err instanceof DatabaseError) {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: err.message,
               });
            }
            throw err;
         }
      }),
});
