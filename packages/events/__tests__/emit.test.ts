import { describe, expect, it, mock } from "bun:test";
import type { DatabaseInstance } from "@packages/database/client";

// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------

const mockFindMatchingWebhooks = mock<
   (...args: [DatabaseInstance, string, string, string?]) => Promise<unknown[]>
>(async () => []);
const mockCreateWebhookDelivery = mock(async () => ({ id: "delivery-1" }));

mock.module("@packages/database/repositories/webhook-repository", () => ({
   findMatchingWebhooks: mockFindMatchingWebhooks,
   createWebhookDelivery: mockCreateWebhookDelivery,
}));

const mockQueueAdd = mock(async () => undefined);
const mockCreateWebhookDeliveryQueue = mock(() => ({
   add: mockQueueAdd,
}));
const mockCreateQueueConnection = mock(() => ({}));

mock.module("@packages/queue/connection", () => ({
   createQueueConnection: mockCreateQueueConnection,
}));

mock.module("@packages/queue/webhook-delivery", () => ({
   createWebhookDeliveryQueue: mockCreateWebhookDeliveryQueue,
}));

import { EVENT_CATEGORIES } from "../src/catalog";
import { emitEvent, initializeWebhookQueue } from "../src/emit";

function createMockDb() {
   const mockReturning = mock().mockResolvedValue([
      {
         id: "event-1",
      },
   ]);
   const mockValues = mock().mockReturnValue({ returning: mockReturning });
   const mockInsert = mock().mockReturnValue({ values: mockValues });

   const mockLimit = mock().mockResolvedValue([
      {
         pricePerEvent: "0",
      },
   ]);
   const mockWhere = mock().mockReturnValue({ limit: mockLimit });
   const mockFrom = mock().mockReturnValue({ where: mockWhere });
   const mockSelect = mock().mockReturnValue({ from: mockFrom });

   return {
      insert: mockInsert,
      select: mockSelect,
   } as unknown as DatabaseInstance;
}

describe("emitEvent", () => {
   it("passes teamId to findMatchingWebhooks", async () => {
      const db = createMockDb();
      initializeWebhookQueue("redis://test");

      await emitEvent({
         db,
         organizationId: "org-1",
         eventName: "content.page.published",
         eventCategory: EVENT_CATEGORIES.content,
         properties: { foo: "bar" },
         userId: "user-1",
         teamId: "team-1",
      });

      expect(mockFindMatchingWebhooks).toHaveBeenCalledTimes(1);
      expect(mockFindMatchingWebhooks).toHaveBeenCalledWith(
         db,
         "org-1",
         "content.page.published",
         "team-1",
      );
   });
});
