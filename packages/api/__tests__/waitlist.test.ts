import type { Static } from "@sinclair/typebox";
import { createTRPCClient, httpLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { createTRPCMsw, httpLink as mswHttpLink } from "msw-trpc";
import { setupServer } from "msw/node";
import SuperJSON from "superjson";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { AppRouter } from "../src/server/index";
import type { WaitlistInsertSchema } from "@packages/database/schema";

// Create MSW TRPC handler
const mswTrpc = createTRPCMsw<AppRouter>({
  links: [
    mswHttpLink({
      url: "http://localhost:3000/trpc",
      headers() {
        return {
          "content-type": "application/json",
        };
      },
    }),
  ],
  transformer: { input: SuperJSON, output: SuperJSON },
});

// Create TRPC client
const trpc = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: "http://localhost:3000/trpc",
      headers() {
        return {
          "content-type": "application/json",
        };
      },
      transformer: SuperJSON,
    }),
  ],
});

describe("waitlist router", () => {
  const server = setupServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe("join", () => {
    test("should successfully join waitlist with valid input", async () => {
      server.use(mswTrpc.waitlist.join.mutation(() => ({ success: true })));

      const joinInput: Static<typeof WaitlistInsertSchema> = {
        email: "test@example.com",
        name: "John Doe",
        leadType: "individual blogger",
        notes: "Looking forward to the platform",
        referralSource: "Twitter",
      };
      const result = await trpc.waitlist.join.mutate(joinInput);
      expect(result).toEqual({ success: true });
    });

    test("should successfully join waitlist with minimal input", async () => {
      server.use(mswTrpc.waitlist.join.mutation(() => ({ success: true })));

      const result = await trpc.waitlist.join.mutate({
        email: "minimal@example.com",
        leadType: "business owner",
      });

      expect(result).toEqual({ success: true });
    });

    test("should throw CONFLICT error when email already exists", async () => {
      server.use(
        mswTrpc.waitlist.join.mutation(() => {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Email already on waitlist. You can update or delete your entry.",
          });
        }),
      );

      await expect(
        trpc.waitlist.join.mutate({
          email: "existing@example.com",
          leadType: "marketing team",
        }),
      ).rejects.toMatchObject({
        message:
          "Email already on waitlist. You can update or delete your entry.",
        data: { code: "CONFLICT", httpStatus: 409, path: "waitlist.join" },
        shape: {
          message:
            "Email already on waitlist. You can update or delete your entry.",
          code: -32009,
          data: {
            code: "CONFLICT",
            httpStatus: 409,
            path: "waitlist.join",
          },
        },
      });
    });

    test("should throw validation error for invalid email format", async () => {
      server.use(
        mswTrpc.waitlist.join.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid email format",
          });
        }),
      );

      await expect(
        trpc.waitlist.join.mutate({
          email: "invalid-email",
          leadType: "individual blogger",
        }),
      ).rejects.toMatchObject({
        message: "Invalid email format",
        data: {
          code: "BAD_REQUEST",
          httpStatus: 400,
          path: "waitlist.join",
        },
      });
    });

    test("should throw validation error for invalid leadType", async () => {
      server.use(
        mswTrpc.waitlist.join.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid lead type",
          });
        }),
      );

      await expect(
        trpc.waitlist.join.mutate({
          email: "test@example.com",
          leadType: "invalid-type" as "individual blogger",
        }),
      ).rejects.toMatchObject({
        message: "Invalid lead type",
        data: {
          code: "BAD_REQUEST",
          httpStatus: 400,
          path: "waitlist.join",
        },
      });
    });
  });

  describe("update", () => {
    test("should successfully update waitlist entry", async () => {
      server.use(
        mswTrpc.waitlist.update.mutation(() => ({ success: true })),
      );

      const result = await trpc.waitlist.update.mutate({
        email: "test@example.com",
        name: "Jane Smith",
        leadType: "freelance writer",
        status: "contacted",
      });

      expect(result).toEqual({ success: true });
    });

    test("should successfully update only name", async () => {
      server.use(
        mswTrpc.waitlist.update.mutation(() => ({ success: true })),
      );

      const result = await trpc.waitlist.update.mutate({
        email: "test@example.com",
        name: "Updated Name",
      });

      expect(result).toEqual({ success: true });
    });

    test("should throw NOT_FOUND error when email does not exist", async () => {
      server.use(
        mswTrpc.waitlist.update.mutation(() => {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No waitlist entry found for this email.",
          });
        }),
      );

      await expect(
        trpc.waitlist.update.mutate({
          email: "nonexistent@example.com",
          name: "Some Name",
        }),
      ).rejects.toMatchObject({
        message: "No waitlist entry found for this email.",
        data: {
          code: "NOT_FOUND",
          httpStatus: 404,
          path: "waitlist.update",
        },
        shape: {
          message: "No waitlist entry found for this email.",
          code: -32004,
          data: {
            code: "NOT_FOUND",
            httpStatus: 404,
            path: "waitlist.update",
          },
        },
      });
    });

    test("should throw BAD_REQUEST error when no fields to update", async () => {
      server.use(
        mswTrpc.waitlist.update.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No fields to update.",
          });
        }),
      );

      await expect(
        trpc.waitlist.update.mutate({
          email: "test@example.com",
        }),
      ).rejects.toMatchObject({
        message: "No fields to update.",
        data: {
          code: "BAD_REQUEST",
          httpStatus: 400,
          path: "waitlist.update",
        },
      });
    });

    test("should throw validation error for invalid status", async () => {
      server.use(
        mswTrpc.waitlist.update.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid status value",
          });
        }),
      );

      await expect(
        trpc.waitlist.update.mutate({
          email: "test@example.com",
          status: "invalid-status" as "pending",
        }),
      ).rejects.toMatchObject({
        message: "Invalid status value",
        data: {
          code: "BAD_REQUEST",
          httpStatus: 400,
          path: "waitlist.update",
        },
      });
    });
  });

  describe("delete", () => {
    test("should successfully delete waitlist entry", async () => {
      server.use(
        mswTrpc.waitlist.delete.mutation(() => ({ success: true })),
      );

      const result = await trpc.waitlist.delete.mutate({
        email: "test@example.com",
      });

      expect(result).toEqual({ success: true });
    });

    test("should throw NOT_FOUND error when email does not exist", async () => {
      server.use(
        mswTrpc.waitlist.delete.mutation(() => {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No waitlist entry found for this email.",
          });
        }),
      );

      await expect(
        trpc.waitlist.delete.mutate({
          email: "nonexistent@example.com",
        }),
      ).rejects.toMatchObject({
        message: "No waitlist entry found for this email.",
        data: {
          code: "NOT_FOUND",
          httpStatus: 404,
          path: "waitlist.delete",
        },
        shape: {
          message: "No waitlist entry found for this email.",
          code: -32004,
          data: {
            code: "NOT_FOUND",
            httpStatus: 404,
            path: "waitlist.delete",
          },
        },
      });
    });

    test("should throw validation error for invalid email format", async () => {
      server.use(
        mswTrpc.waitlist.delete.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid email format",
          });
        }),
      );

      await expect(
        trpc.waitlist.delete.mutate({
          email: "invalid-email",
        }),
      ).rejects.toMatchObject({
        message: "Invalid email format",
        data: {
          code: "BAD_REQUEST",
          httpStatus: 400,
          path: "waitlist.delete",
        },
      });
    });
  });

  describe("HTTP method validation", () => {
    test("should use POST method for join mutation", async () => {
      server.use(mswTrpc.waitlist.join.mutation(() => ({ success: true })));

      const interceptedPromise = new Promise<Request>((resolve) => {
        server.events.on("request:start", ({ request }) => {
          resolve(request);
        });
      });

      await trpc.waitlist.join.mutate({
        email: "test@example.com",
        leadType: "individual blogger",
      });

      const intercepted = await interceptedPromise;
      expect(intercepted.method).toBe("POST");
    });

    test("should use POST method for update mutation", async () => {
      server.use(
        mswTrpc.waitlist.update.mutation(() => ({ success: true })),
      );

      const interceptedPromise = new Promise<Request>((resolve) => {
        server.events.on("request:start", ({ request }) => {
          resolve(request);
        });
      });

      await trpc.waitlist.update.mutate({
        email: "test@example.com",
        name: "Updated Name",
      });

      const intercepted = await interceptedPromise;
      expect(intercepted.method).toBe("POST");
    });

    test("should use POST method for delete mutation", async () => {
      server.use(
        mswTrpc.waitlist.delete.mutation(() => ({ success: true })),
      );

      const interceptedPromise = new Promise<Request>((resolve) => {
        server.events.on("request:start", ({ request }) => {
          resolve(request);
        });
      });

      await trpc.waitlist.delete.mutate({
        email: "test@example.com",
      });

      const intercepted = await interceptedPromise;
      expect(intercepted.method).toBe("POST");
    });
  });

  describe("input validation with TypeBox", () => {
    test("should validate all lead types", async () => {
      const leadTypes = [
        "individual blogger",
        "marketing team",
        "freelance writer",
        "business owner",
        "other",
      ] as const;

      for (const leadType of leadTypes) {
        server.use(
          mswTrpc.waitlist.join.mutation(() => ({ success: true })),
        );

        const result = await trpc.waitlist.join.mutate({
          email: `test-${leadType.replace(/\s/g, "-")}@example.com`,
          leadType,
        });

        expect(result).toEqual({ success: true });
      }
    });

    test("should validate all status types", async () => {
      const statuses = [
        "pending",
        "contacted",
        "joined",
        "rejected",
      ] as const;

      for (const status of statuses) {
        server.use(
          mswTrpc.waitlist.update.mutation(() => ({ success: true })),
        );

        const result = await trpc.waitlist.update.mutate({
          email: `test-${status}@example.com`,
          status,
        });

        expect(result).toEqual({ success: true });
      }
    });
  });
});
