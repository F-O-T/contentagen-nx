import { createTRPCClient, httpLink } from "@trpc/client";
import { setupServer } from "msw/node";
import { describe, test, beforeAll, afterAll, expect, afterEach } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { httpLink as mswHttpLink } from "msw-trpc";
import SuperJSON from "superjson";
import type { AppRouter } from "../src/server/index";
import type {
   ExportLogInsertSchema,
   ExportLogUpdateSchema,
   ExportLogSelectSchema,
   ExportLogOptionsSchema,
} from "../../../packages/database/src/schemas/export-log";
import type { Static } from "@sinclair/typebox";

const mswTrpc = createTRPCMsw<AppRouter>({
   links: [
      mswHttpLink({
         url: "http://localhost:3000/trpc",
         headers() {
            return { "content-type": "application/json" };
         },
      }),
   ],
   transformer: { input: SuperJSON, output: SuperJSON },
});

const trpc = createTRPCClient<AppRouter>({
   links: [
      httpLink({
         url: "http://localhost:3000/trpc",
         headers() {
            return { "content-type": "application/json" };
         },
         transformer: SuperJSON,
      }),
   ],
});

describe("exportLog router", () => {
   const server = setupServer();
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());

   const exportLogId = "00000000-0000-0000-0000-000000000001";
   const contentId = "00000000-0000-0000-0000-000000000002";
   const userId = "user-123";
   const options: Static<typeof ExportLogOptionsSchema> = {
      format: "json",
      fileName: "export.json",
   };
   const exportLog: Static<typeof ExportLogSelectSchema> = {
      id: exportLogId,
      contentId,
      userId,
      options,
      createdAt: new Date(),
   };

   test("should create an export log", async () => {
      server.use(
         mswTrpc.exportLog.create.mutation(({ input }) => ({
            id: exportLogId,
            contentId: input.contentId,
            userId: input.userId,
            options: input.options ?? options,
            createdAt: new Date(),
         })),
      );
      const createInput: Static<typeof ExportLogInsertSchema> = {
         contentId,
         userId,
         options,
      };
      const result: Static<typeof ExportLogSelectSchema> =
         await trpc.exportLog.create.mutate(createInput);
      expect(result).toMatchObject({
         id: exportLogId,
         contentId,
         userId,
         options,
         createdAt: expect.any(Date),
      });
   });

   test("should get an export log", async () => {
      server.use(
         mswTrpc.exportLog.get.query(() => ({ ...exportLog, options })),
      );
      const result: Static<typeof ExportLogSelectSchema> =
         await trpc.exportLog.get.query({ id: exportLogId });
      expect(result).toMatchObject(exportLog);
   });

   test("should update an export log", async () => {
      server.use(mswTrpc.exportLog.update.mutation(() => ({ success: true })));
      const updateInput: Static<typeof ExportLogUpdateSchema> = {
         id: exportLogId,
         options: { format: "csv", fileName: "export.csv" },
      };
      const result = await trpc.exportLog.update.mutate(updateInput);
      expect(result).toEqual({ success: true });
   });

   test("should delete an export log", async () => {
      server.use(mswTrpc.exportLog.delete.mutation(() => ({ success: true })));
      const result = await trpc.exportLog.delete.mutate({ id: exportLogId });
      expect(result).toEqual({ success: true });
   });

   test("should list export logs", async () => {
      server.use(mswTrpc.exportLog.list.query(() => [exportLog]));
      const result: Static<typeof ExportLogSelectSchema>[] =
         await trpc.exportLog.list.query();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject(exportLog);
   });
});
