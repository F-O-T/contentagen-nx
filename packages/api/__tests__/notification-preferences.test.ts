import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCMsw, httpLink as mswHttpLink } from "msw-trpc";
import { setupServer } from "msw/node";
import SuperJSON from "superjson";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { AppRouter } from "../src/server/index";
import type { Static } from "@sinclair/typebox";
import type {
   NotificationPreferencesInsertSchema,
   NotificationPreferencesUpdateSchema,
   NotificationPreferencesSelectSchema,
} from "@packages/database/schema";

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

describe("notificationPreferences router", () => {
   const server = setupServer();
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());

   const prefId = "00000000-0000-0000-0000-000000000001";
   const userId = "user-123";
   const type = "email";
   const prefData: Static<typeof NotificationPreferencesSelectSchema> = {
      id: prefId,
      userId,
      type,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
   };

   test("should create notification preferences", async () => {
      server.use(
         mswTrpc.notificationPreferences.create.mutation(({ input }) => ({
            ...prefData,
            ...input,
            id: prefId,
         })),
      );
      const createInput: Static<typeof NotificationPreferencesInsertSchema> = {
         userId,
         type,
         enabled: true,
      };
      const result =
         await trpc.notificationPreferences.create.mutate(createInput);
      expect(result).toMatchObject({ ...prefData, ...createInput });
   });

   test("should get notification preferences by id", async () => {
      server.use(
         mswTrpc.notificationPreferences.get.query(({ input }) => ({
            ...prefData,
            id: input.id,
         })),
      );
      const result = await trpc.notificationPreferences.get.query({
         id: prefId,
      });
      expect(result).toMatchObject(prefData);
   });

   test("should list notification preferences by userId", async () => {
      server.use(
         mswTrpc.notificationPreferences.list.query(({ input }) => [prefData]),
      );
      const result = await trpc.notificationPreferences.list.query({ userId });
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject(prefData);
   });

   test("should get notification preferences by user and type", async () => {
      server.use(
         mswTrpc.notificationPreferences.getByUserAndType.query(
            ({ input }) => ({
               ...prefData,
               userId: input.userId,
               type: input.type,
            }),
         ),
      );
      const result = await trpc.notificationPreferences.getByUserAndType.query({
         userId,
         type,
      });
      expect(result).toMatchObject({ ...prefData, userId, type });
   });

   test("should update notification preferences", async () => {
      server.use(
         mswTrpc.notificationPreferences.update.mutation(() => ({
            success: true,
         })),
      );
      const updateInput: Static<typeof NotificationPreferencesUpdateSchema> = {
         id: prefId,
         enabled: false,
      };
      const result =
         await trpc.notificationPreferences.update.mutate(updateInput);
      expect(result).toEqual({ success: true });
   });

   test("should delete notification preferences", async () => {
      server.use(
         mswTrpc.notificationPreferences.delete.mutation(() => ({
            success: true,
         })),
      );
      const result = await trpc.notificationPreferences.delete.mutate({
         id: prefId,
      });
      expect(result).toEqual({ success: true });
   });

   test("should return not found for get", async () => {
      server.use(
         mswTrpc.notificationPreferences.get.query(() => {
            throw Object.assign(new Error("Not found"), { code: "NOT_FOUND" });
         }),
      );
      await expect(
         trpc.notificationPreferences.get.query({ id: "not-exist" }),
      ).rejects.toBeTruthy();
   });
});
