import {
  createContent,
  getContentById,
  updateContent,
  deleteContent,
  listContents,
} from "@packages/database/repositories/content-repository";
import { NotFoundError, DatabaseError } from "@packages/errors";
import { Type } from "@sinclair/typebox";
import { TRPCError } from "@trpc/server";
import { wrap } from "@typeschema/typebox";

import { protectedProcedure, router } from "../trpc";

// Input schemas
import {
  ContentMetaSchema,
  ContentRequestSchema,
  ContentStatsSchema,
} from "@packages/database/schema";

const ContentStatusEnum = Type.Union([
  Type.Literal("draft"),
  Type.Literal("approved"),
  Type.Literal("generating"),
]);

const CreateContentInput = Type.Object({
  agentId: Type.String({ format: "uuid" }),
  userId: Type.String(),
  title: Type.String(),
  body: Type.String(),
  status: Type.Optional(ContentStatusEnum),
  meta: Type.Optional(ContentMetaSchema),
  request: ContentRequestSchema,
  stats: Type.Optional(ContentStatsSchema),
});

const UpdateContentInput = Type.Object({
  id: Type.String({ format: "uuid" }),
  agentId: Type.Optional(Type.String({ format: "uuid" })),
  userId: Type.Optional(Type.String()),
  title: Type.Optional(Type.String()),
  body: Type.Optional(Type.String()),
  status: Type.Optional(ContentStatusEnum),
  meta: Type.Optional(ContentMetaSchema),
  request: Type.Optional(ContentRequestSchema),
  stats: Type.Optional(ContentStatsSchema),
});

const DeleteContentInput = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const GetContentInput = Type.Object({
  id: Type.String({ format: "uuid" }),
});

export const contentRouter = router({
  create: protectedProcedure
    .input(wrap(CreateContentInput))
    .mutation(async ({ ctx, input }) => {
      try {
        return await createContent(ctx.db, input);
      } catch (err) {
        if (err instanceof DatabaseError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: err.message,
          });
        }
        throw err;
      }
    }),
  update: protectedProcedure
    .input(wrap(UpdateContentInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateFields } = input;
      try {
        await updateContent(ctx.db, id, updateFields);
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
  delete: protectedProcedure
    .input(wrap(DeleteContentInput))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      try {
        await deleteContent(ctx.db, id);
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
  get: protectedProcedure
    .input(wrap(GetContentInput))
    .query(async ({ ctx, input }) => {
      try {
        return await getContentById(ctx.db, input.id);
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
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      return await listContents(ctx.db);
    } catch (err) {
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
