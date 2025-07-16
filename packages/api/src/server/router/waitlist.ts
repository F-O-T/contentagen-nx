import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { Type } from "@sinclair/typebox";
import { wrap } from "@typeschema/typebox";
import { waitlist } from "@packages/database";

const leadTypeValues = [
   "individual blogger",
   "marketing team",
   "freelance writer",
   "business owner",
   "other",
] as const;
const statusValues = ["pending", "contacted", "joined", "rejected"] as const;

const JoinInput = Type.Object({
   email: Type.String({ format: "email" }),
   name: Type.Optional(Type.String()),
   leadType: Type.Union(leadTypeValues.map((v) => Type.Literal(v))),
   notes: Type.Optional(Type.String()),
   referralSource: Type.Optional(Type.String()),
});

const UpdateInput = Type.Object({
   email: Type.String({ format: "email" }),
   name: Type.Optional(Type.String()),
   leadType: Type.Optional(
      Type.Union(leadTypeValues.map((v) => Type.Literal(v))),
   ),
   notes: Type.Optional(Type.String()),
   referralSource: Type.Optional(Type.String()),
   status: Type.Optional(Type.Union(statusValues.map((v) => Type.Literal(v)))),
});

const DeleteInput = Type.Object({
   email: Type.String({ format: "email" }),
});

export const waitlistRouter = router({
   join: publicProcedure
      .input(wrap(JoinInput))
      .mutation(async ({ ctx, input }) => {
         const existing = await ctx.db
            .select()
            .from(waitlist)
            .where(eq(waitlist.email, input.email));
         if (existing.length > 0) {
            throw new TRPCError({
               code: "CONFLICT",
               message:
                  "Email already on waitlist. You can update or delete your entry.",
            });
         }
         await ctx.db.insert(waitlist).values({
            email: input.email,
            name: input.name,
            leadType: input.leadType,
            notes: input.notes,
            referralSource: input.referralSource,
         });
         return { success: true };
      }),
   update: publicProcedure
      .input(wrap(UpdateInput))
      .mutation(async ({ ctx, input }) => {
         const existing = await ctx.db
            .select()
            .from(waitlist)
            .where(eq(waitlist.email, input.email));
         if (existing.length === 0) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "No waitlist entry found for this email.",
            });
         }
         const { email, ...updateFields } = input;
         if (Object.keys(updateFields).length === 0) {
            throw new TRPCError({
               code: "BAD_REQUEST",
               message: "No fields to update.",
            });
         }
         await ctx.db
            .update(waitlist)
            .set(updateFields)
            .where(eq(waitlist.email, email));
         return { success: true };
      }),
   delete: publicProcedure
      .input(wrap(DeleteInput))
      .mutation(async ({ ctx, input }) => {
         const existing = await ctx.db
            .select()
            .from(waitlist)
            .where(eq(waitlist.email, input.email));
         if (existing.length === 0) {
            throw new TRPCError({
               code: "NOT_FOUND",
               message: "No waitlist entry found for this email.",
            });
         }
         await ctx.db.delete(waitlist).where(eq(waitlist.email, input.email));
         return { success: true };
      }),
});
