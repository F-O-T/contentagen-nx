import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCMsw, httpLink as mswHttpLink } from "msw-trpc";
import { setupServer } from "msw/node";
import SuperJSON from "superjson";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { AppRouter } from "../src/server/index";
import type { Static } from "@sinclair/typebox";
import type {
   NotificationInsertSchema,
   NotificationUpdateSchema,
   NotificationSelectSchema,
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

describe("notification router", () => {
   const server = setupServer();
   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());

   const notificationId = "00000000-0000-0000-0000-000000000001";
   const userId = "user-123";
   const notificationData: Static<typeof NotificationSelectSchema> = {
      id: notificationId,
      userId,
      type: "email",
      title: "Test Notification",
      message: "This is a test notification.",
      data: {},
      read: false,
      createdAt: new Date(),
      sentAt: null,
      error: null,
   };

   test("should create notification", async () => {
      server.use(
         mswTrpc.notification.create.mutation(({ input }) => ({
            ...notificationData,
            ...input,
            id: notificationId,
         })),
      );
      const createInput: Static<typeof NotificationInsertSchema> = {
         userId,
         type: "email",
         title: "Test Notification",
         message: "This is a test notification.",
         data: {},
         read: false,
      };
      const result = await trpc.notification.create.mutate(createInput);
      expect(result).toMatchObject({ ...notificationData, ...createInput });
   });

   test("should get notification by id", async () => {
      server.use(
         mswTrpc.notification.get.query(({ input }) => ({
            ...notificationData,
            id: input.id,
         })),
      );
      const result = await trpc.notification.get.query({ id: notificationId });
      expect(result).toMatchObject(notificationData);
   });

   test("should list notifications by userId", async () => {
      server.use(
         mswTrpc.notification.list.query(({ input }) => [notificationData]),
      );
      const result = await trpc.notification.list.query({ userId });
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject(notificationData);
   });

   test("should update notification", async () => {
      server.use(
         mswTrpc.notification.update.mutation(() => ({ success: true })),
      );
      const updateInput: Static<typeof NotificationUpdateSchema> = {
         id: notificationId,
         read: true,
      };
      const result = await trpc.notification.update.mutate(updateInput);
      expect(result).toEqual({ success: true });
   });

   test("should delete notification", async () => {
      server.use(
         mswTrpc.notification.delete.mutation(() => ({ success: true })),
      );
      const result = await trpc.notification.delete.mutate({
         id: notificationId,
      });
      expect(result).toEqual({ success: true });
   });

   test("should return not found for get", async () => {
      server.use(
         mswTrpc.notification.get.query(() => {
            throw Object.assign(new Error("Not found"), { code: "NOT_FOUND" });
         }),
      );
      await expect(
         trpc.notification.get.query({ id: "not-exist" }),
      ).rejects.toBeTruthy();
   });
});
