import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createSdk } from "../src/index";

const apiKey = "test-api-key";
const agentId = "123e4567-e89b-12d3-a456-426614174000";
let sdk: ReturnType<typeof createSdk>;
let fetchMock: ReturnType<typeof vi.fn>;

// listContentByAgent tests
const validListInput = {
   status: ["draft", "approved"] as Array<"draft" | "approved" | "generating">,
   agentId,
   limit: 2,
   page: 1,
};
const mockListResponse = {
   result: {
      data: {
         json: {
            posts: [
               {
                  id: "post1",
                  meta: {
                     title: "Test Title",
                     slug: "test-title",
                     tags: ["tag1"],
                     topics: ["topic1"],
                     sources: ["source1"],
                  },
                  imageUrl: null,
                  status: "draft",
                  createdAt: new Date().toISOString(),
                  stats: {
                     wordsCount: "100",
                     readTimeMinutes: "2",
                     qualityScore: "A",
                  },
               },
            ],
            total: 1,
         },
      },
   },
};

describe("ContentaGenSDK.listContentByAgent", () => {
   beforeEach(() => {
      sdk = createSdk({ apiKey });
      fetchMock = vi.fn().mockResolvedValue({
         ok: true,
         json: () => Promise.resolve(mockListResponse),
         statusText: "OK",
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
   });

   afterEach(() => {
      vi.restoreAllMocks();
   });

   it("returns parsed content list for valid input", async () => {
      const result = await sdk.listContentByAgent(validListInput);
      const expected = {
         ...mockListResponse.result.data.json,
         posts: mockListResponse.result.data.json.posts.map((post) => ({
            ...post,
            createdAt: new Date(post.createdAt),
         })),
      };
      expect(result).toEqual(expected);
      expect(fetchMock).toHaveBeenCalledTimes(1);
   });

   it("throws on invalid input", async () => {
      await expect(
         sdk.listContentByAgent({ ...validListInput, agentId: "not-a-uuid" }),
      ).rejects.toThrow(/SDK_E004/);
   });

   it("throws on API error", async () => {
      fetchMock.mockResolvedValueOnce({
         ok: false,
         statusText: "Internal Server Error",
         json: () => Promise.resolve({}),
      });
      await expect(sdk.listContentByAgent(validListInput)).rejects.toThrow(
         /SDK_E002/,
      );
   });
});

// getContentById tests
const validIdInput = { id: agentId };
const mockIdResponse = {
   result: {
      data: {
         json: {
            id: "post1",
            agentId,
            imageUrl: null,
            userId: "user1",
            body: "Test body",
            status: "draft",
            meta: {
               title: "Test Title",
               slug: "test-title",
               tags: ["tag1"],
               topics: ["topic1"],
               sources: ["source1"],
            },
            request: { description: "desc" },
            stats: {
               wordsCount: "100",
               readTimeMinutes: "2",
               qualityScore: "A",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
         },
      },
   },
};

describe("ContentaGenSDK.getContentById", () => {
   beforeEach(() => {
      sdk = createSdk({ apiKey });
      fetchMock = vi.fn().mockResolvedValue({
         ok: true,
         json: () => Promise.resolve(mockIdResponse),
         statusText: "OK",
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
   });

   afterEach(() => {
      vi.restoreAllMocks();
   });

   it("returns parsed content for valid input", async () => {
      const result = await sdk.getContentById(validIdInput);
      const expected = {
         ...mockIdResponse.result.data.json,
         createdAt: new Date(mockIdResponse.result.data.json.createdAt),
         updatedAt: new Date(mockIdResponse.result.data.json.updatedAt),
      };
      expect(result).toEqual(expected);
      expect(fetchMock).toHaveBeenCalledTimes(1);
   });

   it("throws on invalid input", async () => {
      await expect(sdk.getContentById({ id: "not-a-uuid" })).rejects.toThrow(
         /SDK_E004/,
      );
   });

   it("throws on API error", async () => {
      fetchMock.mockResolvedValueOnce({
         ok: false,
         statusText: "Internal Server Error",
         json: () => Promise.resolve({}),
      });
      await expect(sdk.getContentById(validIdInput)).rejects.toThrow(
         /SDK_E002/,
      );
   });
});

// getContentBySlug tests
const validSlugInput = { slug: "test-title" };
const mockSlugResponse = {
   result: {
      data: {
         json: {
            id: "post1",
            agentId,
            imageUrl: null,
            userId: "user1",
            body: "Test body",
            status: "draft",
            meta: {
               title: "Test Title",
               slug: "test-title",
               tags: ["tag1"],
               topics: ["topic1"],
               sources: ["source1"],
            },
            request: { description: "desc" },
            stats: {
               wordsCount: "100",
               readTimeMinutes: "2",
               qualityScore: "A",
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
         },
      },
   },
};

describe("ContentaGenSDK.getContentBySlug", () => {
   beforeEach(() => {
      sdk = createSdk({ apiKey });
      fetchMock = vi.fn().mockResolvedValue({
         ok: true,
         json: () => Promise.resolve(mockSlugResponse),
         statusText: "OK",
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;
   });

   afterEach(() => {
      vi.restoreAllMocks();
   });

   it("returns parsed content for valid input", async () => {
      const result = await sdk.getContentBySlug(validSlugInput);
      const expected = {
         ...mockSlugResponse.result.data.json,
         createdAt: new Date(mockSlugResponse.result.data.json.createdAt),
         updatedAt: new Date(mockSlugResponse.result.data.json.updatedAt),
      };
      expect(result).toEqual(expected);
      expect(fetchMock).toHaveBeenCalledTimes(1);
   });

   it("throws on invalid input", async () => {
      await expect(sdk.getContentBySlug({ slug: "" })).rejects.toThrow(
         /SDK_E004/,
      );
   });

   it("throws on API error", async () => {
      fetchMock.mockResolvedValueOnce({
         ok: false,
         statusText: "Internal Server Error",
         json: () => Promise.resolve({}),
      });
      await expect(sdk.getContentBySlug(validSlugInput)).rejects.toThrow(
         /SDK_E002/,
      );
   });
});
